using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class UnblendChecker {
  public static void Run(string input, string output) {
    using (var src = new Bitmap(input)) {
      int w = src.Width;
      int h = src.Height;
      var bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
      using (var g = Graphics.FromImage(bmp)) g.DrawImage(src, 0, 0, w, h);

      var rect = new Rectangle(0, 0, w, h);
      var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
      int stride = data.Stride;
      byte[] px = new byte[Math.Abs(stride) * h];
      Marshal.Copy(data.Scan0, px, 0, px.Length);

      int tile = DetectTile(px, stride, w, h);
      float cLight;
      float cDark;
      SampleCheckers(px, stride, w, h, tile, out cLight, out cDark);

      float[] lum = new float[w * h];
      for (int y = 0; y < h; y++) {
        for (int x = 0; x < w; x++) {
          int o = y * stride + x * 4;
          lum[y * w + x] = (px[o + 2] + px[o + 1] + px[o]) / 3f;
        }
      }

      float[] blur = BoxBlur(lum, w, h, Math.Max(tile, 16));
      float cAvg = (cLight + cDark) * 0.5f;
      float half = (cLight - cDark) * 0.5f;
      if (half < 8f) half = 8f;

      for (int y = 0; y < h; y++) {
        for (int x = 0; x < w; x++) {
          int o = y * stride + x * 4;
          float b = px[o];
          float gch = px[o + 1];
          float r = px[o + 2];
          float yv = lum[y * w + x];
          float yb = blur[y * w + x];

          int tx = x / tile;
          int ty = y / tile;
          float cExp = ((tx + ty) & 1) == 0 ? cLight : cDark;
          float denom = cExp - cAvg;
          float aChk = 1f;
          if (Math.Abs(denom) > 4f) aChk = 1f - (yv - yb) / denom;

          float amin = 0f;
          amin = Math.Max(amin, ChannelMinAlpha(r, cExp));
          amin = Math.Max(amin, ChannelMinAlpha(gch, cExp));
          amin = Math.Max(amin, ChannelMinAlpha(b, cExp));

          float chroma = Math.Max(Math.Abs(r - gch), Math.Max(Math.Abs(gch - b), Math.Abs(r - b)));
          float a = aChk;
          if (chroma > 8f) a = Math.Max(a, amin);
          if (a < amin * 0.55f) a = amin * 0.55f;
          if (a < 0f) a = 0f;
          if (a > 1f) a = 1f;
          if (a < 0.035f) {
            px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; px[o + 3] = 0;
            continue;
          }

          float ia = 1f - a;
          float fr = (r - ia * cExp) / a;
          float fg = (gch - ia * cExp) / a;
          float fb = (b - ia * cExp) / a;
          px[o] = Clamp(fb);
          px[o + 1] = Clamp(fg);
          px[o + 2] = Clamp(fr);
          px[o + 3] = Clamp(a * 255f);
        }
      }

      Marshal.Copy(px, 0, data.Scan0, px.Length);
      bmp.UnlockBits(data);
      bmp.Save(output, ImageFormat.Png);
      bmp.Dispose();
      Console.WriteLine("tile=" + tile + " light=" + cLight + " dark=" + cDark + " -> " + output);
    }
  }

  static float ChannelMinAlpha(float p, float c) {
    if (p >= c) {
      float d = 255f - c;
      return d < 1f ? 0f : (p - c) / d;
    }
    return c < 1f ? 0f : (c - p) / c;
  }

  static byte Clamp(float v) {
    if (v < 0f) return 0;
    if (v > 255f) return 255;
    return (byte)(v + 0.5f);
  }

  static int DetectTile(byte[] px, int stride, int w, int h) {
    float first = px[2];
    for (int x = 4; x < Math.Min(w, 80); x++) {
      float r = px[x * 4 + 2];
      if (Math.Abs(r - first) > 20) return x;
    }
    return 24;
  }

  static void SampleCheckers(byte[] px, int stride, int w, int h, int tile, out float cLight, out float cDark) {
    double sum0 = 0, sum1 = 0;
    int n0 = 0, n1 = 0;
    int inset = Math.Max(4, tile / 4);
    for (int ty = 0; ty < 4; ty++) {
      for (int tx = 0; tx < 4; tx++) {
        int cx = tx * tile + tile / 2;
        int cy = ty * tile + tile / 2;
        if (cx >= w || cy >= h) continue;
        int o = cy * stride + cx * 4;
        float v = (px[o] + px[o + 1] + px[o + 2]) / 3f;
        if (((tx + ty) & 1) == 0) { sum0 += v; n0++; }
        else { sum1 += v; n1++; }
      }
    }
    float a = n0 > 0 ? (float)(sum0 / n0) : 94f;
    float b = n1 > 0 ? (float)(sum1 / n1) : 56f;
    if (a >= b) { cLight = a; cDark = b; }
    else { cLight = b; cDark = a; }
  }

  static float[] BoxBlur(float[] src, int w, int h, int radius) {
    float[] tmp = new float[w * h];
    float[] dst = new float[w * h];
    int span = radius * 2 + 1;
    for (int y = 0; y < h; y++) {
      float acc = 0;
      for (int x = -radius; x <= radius; x++) acc += src[y * w + ClampIdx(x, w)];
      for (int x = 0; x < w; x++) {
        tmp[y * w + x] = acc / span;
        acc -= src[y * w + ClampIdx(x - radius, w)];
        acc += src[y * w + ClampIdx(x + radius + 1, w)];
      }
    }
    for (int x = 0; x < w; x++) {
      float acc = 0;
      for (int y = -radius; y <= radius; y++) acc += tmp[ClampIdx(y, h) * w + x];
      for (int y = 0; y < h; y++) {
        dst[y * w + x] = acc / span;
        acc -= tmp[ClampIdx(y - radius, h) * w + x];
        acc += tmp[ClampIdx(y + radius + 1, h) * w + x];
      }
    }
    return dst;
  }

  static int ClampIdx(int v, int max) {
    if (v < 0) return 0;
    if (v >= max) return max - 1;
    return v;
  }
}

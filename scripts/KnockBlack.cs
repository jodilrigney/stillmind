using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class KnockBlackHalo {
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

      bool[] vis = new bool[w * h];
      Queue<int> q = new Queue<int>();
      Action<int, int> tryEnq = delegate(int x, int y) {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        int i = y * w + x;
        if (vis[i]) return;
        int o = y * stride + x * 4;
        int m = px[o];
        if (px[o + 1] > m) m = px[o + 1];
        if (px[o + 2] > m) m = px[o + 2];
        if (m > 40) return;
        vis[i] = true;
        q.Enqueue(i);
      };
      for (int x = 0; x < w; x++) { tryEnq(x, 0); tryEnq(x, h - 1); }
      for (int y = 0; y < h; y++) { tryEnq(0, y); tryEnq(w - 1, y); }
      while (q.Count > 0) {
        int i = q.Dequeue();
        int x = i % w;
        int y = i / w;
        int o = y * stride + x * 4;
        px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; px[o + 3] = 0;
        tryEnq(x + 1, y); tryEnq(x - 1, y); tryEnq(x, y + 1); tryEnq(x, y - 1);
      }

      for (int y = 0; y < h; y++) {
        for (int x = 0; x < w; x++) {
          int o = y * stride + x * 4;
          if (px[o + 3] == 0) continue;
          int b = px[o];
          int gc = px[o + 1];
          int r = px[o + 2];
          int m = b;
          if (gc > m) m = gc;
          if (r > m) m = r;
          if (m < 28) {
            px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; px[o + 3] = 0;
            continue;
          }
          int a = 255;
          if (m < 62) a = (int)((m - 24) / 38.0 * 255.0);
          if (a < 0) a = 0;
          if (a > 255) a = 255;
          px[o + 3] = (byte)a;
        }
      }

      Marshal.Copy(px, 0, data.Scan0, px.Length);
      bmp.UnlockBits(data);
      bmp.Save(output, ImageFormat.Png);
      bmp.Dispose();
    }
  }
}

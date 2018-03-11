using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace svg_fixer
{
   class Program
   {
      static void Main(string[] args)
      {
         var svgFiles = Directory.GetFiles(@"C:\regressionbuddy\client\public\images", "*.svg", SearchOption.AllDirectories);
         // above search pattern doesn't completely work for this purpose. for example, .svg.txt, .svg2, etc. will return just fine
         svgFiles = svgFiles.Where(F => F.EndsWith(".svg")).ToArray();

         foreach(var file in svgFiles)
         {
            fixSVGFile(@"C:\regressionbuddy\client\public\images\1\trigonometry\wk1-q2.svg");
         }
      }

      private static void fixSVGFile(string path)
      {
         XmlDocument doc = new XmlDocument();
         doc.Load(path);
         //doc.LoadXml("<svg><fuckingwork></fuckingwork></svg>");
         //var oidjsoiuorew = doc.SelectSingleNode("svg");
         //var okljih = doc.SelectSingleNode("//fuckingwork");

         MakeBackgroundTransparent(doc);

         doc.Save(path);
      }

      private static void MakeBackgroundTransparent(XmlDocument doc)
      {
         var rect = doc.SelectSingleNode("defs");
         var rect2 = doc.SelectSingleNode("//defs");
         var rect3 = doc.DocumentElement.SelectSingleNode("defs");
         var rect4 = doc.DocumentElement.SelectSingleNode("//defs");
         var rect5 = doc.SelectSingleNode("paths");
         var rect6 = doc.DocumentElement.SelectSingleNode("//paths");
      }
   }
}

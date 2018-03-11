using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace svg_modifier
{
   class Program
   {
      private static XmlDocument doc;
      private static XmlNamespaceManager ns;

      static void Main(string[] args)
      {
         var svgFiles = Directory.GetFiles(@"C:\regressionbuddy\client\public\images", "*.svg", SearchOption.AllDirectories);
         // above search pattern doesn't completely work for this purpose. for example, .svg.txt, .svg2, etc. will return just fine
         svgFiles = svgFiles.Where(F => F.EndsWith(".svg")).ToArray();

         // remove svg files that don't ned to be processed and will blow up if you try processing them
         svgFiles = svgFiles.Where(f =>
         {
            return
            f != @"C:\regressionbuddy\client\public\images\graph-up.svg";

         }).ToArray();

         foreach(var file in svgFiles)
         {
            modifySVGFile(file);
            Console.WriteLine($"Processing Complete: {file}");
         }

         Console.WriteLine("Done");
         Console.ReadLine();
      }

      private static void modifySVGFile(string path)
      {
         doc = new XmlDocument();
         doc.Load(path);

         var namespaceURI = doc.DocumentElement.GetAttribute("xmlns");
         ns = new XmlNamespaceManager(doc.NameTable);
         ns.AddNamespace("s", namespaceURI);

         AddViewBox();
         MakeBackgroundTransparent();
         RemoveTextBackgrounds();

         doc.Save(path);
      }

      private static void AddViewBox()
      {
         // originally figured out this attribute was needed because of a transparency issue in ie 
         var width = doc.DocumentElement.GetAttribute("width");
         var height = doc.DocumentElement.GetAttribute("height");
         var viewBoxValue = $"0 0 {width} {height}";
         doc.DocumentElement.SetAttribute("viewBox", viewBoxValue);
      }

      private static void MakeBackgroundTransparent()
      {
         var rect = doc.SelectSingleNode($"/s:svg/s:g/s:g/s:rect", ns) as XmlElement;
         if(rect == null)
         {
            // assume all svg files that come from geogebra have the rect element here. this isn't perfect because maybe this won't always be the right element, even if it does exist.
            throw new Exception("Couldn't find rect element.");
         }

         var fill = rect.GetAttribute("fill");
         fill = GetRGBAString(fill, 0);
         rect.SetAttribute("fill", fill);
      }

      private static void RemoveTextBackgrounds()
      {
         // some text nodes are accompanied by a duplicate text node that has the same text, is a little bigger, but is 
         // just there so the text is always against a white background. remove that.
         var textNodes = doc.SelectNodes($"//s:text[@stroke-opacity='1']", ns);
         foreach(var node in textNodes)
         {
            var textElement = node as XmlElement;
            textElement.ParentNode.RemoveChild(textElement);
         }
      }

      private static string GetRGBAString(string rgbString, int alpha)
      {
         // works with an rgba string too but will nuke your a value.

         rgbString = rgbString.Substring(rgbString.IndexOf("(")); // trim it down to just (255,123,123)
         rgbString = rgbString.Substring(1); // remove leading (
         rgbString = rgbString.Substring(0, rgbString.Length - 1); // remove trailing )

         var colorComponents = rgbString.Split(',');
         var r = colorComponents[0];
         var g = colorComponents[1];
         var b = colorComponents[2];

         var rgbaString = $"rgba({r},{g},{b},{alpha})";
         return rgbaString;
      }
   }
}

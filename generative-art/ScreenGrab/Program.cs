using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;

namespace ScreenGrab
{
   class Program
   {
      static void Main(string[] args)
      {
         Console.WriteLine("Make sure to go to the color-wander directory and run `npm run start` first.");

         var driver = new ChromeDriver();
         driver.Manage().Window.Size = new System.Drawing.Size(1100, 361);
         IJavaScriptExecutor js = (IJavaScriptExecutor)driver;
         driver.Navigate().GoToUrl("http://192.168.200.199:9966/");

         for (var i = 999;i < 1001; i++)
         {
            System.Threading.Thread.Sleep(15000);
            js.ExecuteScript("document.body.removeChild(document.querySelector('.seed-container'));");
            System.Threading.Thread.Sleep(1000);
            Screenshot ss = ((ITakesScreenshot)driver).GetScreenshot();
            ss.SaveAsFile($"../../../generated-images/{i}.png", ScreenshotImageFormat.Png);
            driver.Navigate().Refresh();
         }

         driver.Quit();
      }
   }
}

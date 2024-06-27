using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Drawing;
using System.Drawing.Printing;
using System.Runtime.Intrinsics.Arm;
using Thomas.TMoji.Logic.TMojiManagement;
using static System.Net.Mime.MediaTypeNames;
using Image = System.Drawing.Image;

namespace Thomas.TMoji.App.WebApi.Controllers
{
    [Route("api/[controller]/[action]")]
    public class TMojiController : ControllerBase
    {
        private readonly MailManager _mailManager;
        private readonly IConfiguration _conifg;

        #region Construtor
        public TMojiController(MailManager mailManager, IConfiguration config)
        {
            _mailManager = mailManager;
            _conifg = config;
        }
        #endregion

        #region Utils
        [HttpPost]
        public async Task<IActionResult> SendMail(string email, string image) //call the mail manager to send mails
        {
            if (String.IsNullOrEmpty(email) || String.IsNullOrEmpty(image) || !_mailManager.IsValidEmail(email).Result)
                return BadRequest("This is not an valid E-Mailaddress.");
            bool good = Task.Run(() => _mailManager.SendMail(email, image)).Result;

            return Ok(good);
        }

        [HttpPost]
        public async Task<IActionResult> PrintImage(string image)   //printer action
        {
            //image
            var base64Image = image.Split(',')[1];
            byte[] imageBytes = Convert.FromBase64String(base64Image);


            string printerName = _conifg.GetValue<string>("PrinterName");
            using var ms = new MemoryStream(imageBytes);
            using var bild = Image.FromStream(ms);

            var printDocument = new PrintDocument();


            printDocument.PrintController = new StandardPrintController();

            PrinterSettings printerSettings = new PrinterSettings();
            printerSettings.PrinterName = printerName;
            printerSettings.Duplex = Duplex.Vertical;



            foreach (PaperSize paperSize in printerSettings.PaperSizes)
            {
                if (paperSize.Kind == PaperKind.A6)
                {
                    printerSettings.DefaultPageSettings.PaperSize = paperSize;
                    break;
                }
            }


            printerSettings.DefaultPageSettings.PrinterResolution = new PrinterResolution()
            {
                Kind = PrinterResolutionKind.Custom,
                X = 1200,
                Y = 1200
            };
            printDocument.PrinterSettings = printerSettings;
            printerSettings.DefaultPageSettings.Color = true;


            printDocument.PrintPage += (sender, e) =>
            {

                e.PageSettings.Color = true;
                // Determine the size of the print area
                var printAreaWidth = e.PageBounds.Width - e.PageSettings.HardMarginX * 2;
                var printAreaHeight = e.PageBounds.Height - e.PageSettings.HardMarginY * 2;

                // Scale the image to the size of the print area
                var scaleFactor = Math.Min((double)printAreaWidth / bild.Width, (double)printAreaHeight / bild.Height);
                var scaledWidth = (int)(bild.Width * scaleFactor);
                var scaledHeight = (int)(bild.Height * scaleFactor);

                // Calculate the position to draw the image centered on the print area
                var x = (printAreaWidth - scaledWidth) / 2 + e.PageSettings.HardMarginX;
                var y = (printAreaHeight - scaledHeight) / 2 + e.PageSettings.HardMarginY;

                // Draw the image on the print area
                e.Graphics.DrawImage(bild, 0, 0, scaledWidth, scaledHeight);
                e.HasMorePages = false;
                e.PageSettings.Color = true;
            };

            printDocument.Print();



            return Ok(true);
        }

        public void SetPaperSize(PrinterSettings printerSettings)
        {
            foreach (PaperSize paperSize in printerSettings.PaperSizes)
            {
                if (paperSize.Kind == PaperKind.A6) // we used DIN A6 paper its works fine
                {
                    printerSettings.DefaultPageSettings.PaperSize = paperSize;
                    break;
                }
            }
        }

        public void SetPaperSource(PrinterSettings printerSettings)
        {
            foreach (PaperSource paperSource in printerSettings.PaperSources)
            {
                if (paperSource.RawKind == (int)PaperSourceKind.FormSource)
                {
                    printerSettings.DefaultPageSettings.PaperSource = paperSource;
                    break;
                }
            }
        }

        [HttpGet]
        public IActionResult GetFilePaths() //Returns the path from emojis
        {
            string rootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot\\images\\Emojis");
            List<string> filePaths = new List<string>();

            GetFilePathsRecursive(rootPath, filePaths);

            var result = new List<string>();
            foreach (string path in filePaths)
            {
                result.Add(GetSubPath(path, Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")));
            }

            return Ok(result);
        }

        static string GetSubPath(string fullPath, string startingFolder)
        {
            // Den Startordner aus dem vollständigen Pfad entfernen
            string subPath = fullPath.Substring(fullPath.IndexOf(startingFolder) + startingFolder.Length);

            // Führende Trennzeichen entfernen, falls vorhanden
            subPath = subPath.TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

            return subPath;
        }

        private void GetFilePathsRecursive(string folderPath, List<string> filePaths)
        {
            string[] files = Directory.GetFiles(folderPath);
            filePaths.AddRange(files);

            string[] subFolders = Directory.GetDirectories(folderPath);
            foreach (string subFolder in subFolders)
            {
                GetFilePathsRecursive(subFolder, filePaths);
            }
        }
        #endregion
    }
}

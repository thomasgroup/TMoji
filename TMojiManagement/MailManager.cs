using MailBodyPack;
using System.Net;
using System.Net.Mail;
using Thomas.TMoji.CrossCutting.Configurations;

namespace Thomas.TMoji.Logic.TMojiManagement
{
    public class MailManager
    {
        private readonly IMailConfig _mailConfig;
        public MailManager(IMailConfig mailConfig)
        {
            _mailConfig = mailConfig;
        }

        public bool SendMail(string userMail, string image)
        {

            MailMessage mailMessage = new MailMessage()
            {
                From = new MailAddress(_mailConfig.SenderMail),
                Subject = "Young talents night",         //set you own Subject
                IsBodyHtml = true
            };

            var template = MailBodyTemplate.GetDefaultTemplate();
            template
                .Image(m => $"<div style='text-align: center'><img style='margin-bottom: 25px; height='{(m.TryGetAttribute("height", out int height) ? height : 0)}' width='{(m.TryGetAttribute("width", out int width) ? width : 0)}' src='{m.Src}'></div>");


            var footer = MailBody
                .CreateBlock()
                .Text("Folge ")
                .Link("http://instagram.com/menschenbeithomas", "Thomas")
                .Text(" auf Instagram und ")
                .Link("https://www.kununu.com/de/thomas-magnete", "Kununu")
                .Text(". Weiteres interessantes zufinden ")
                .Link("https://linktr.ee/menschenbeithomas", "hier.");

            var base64Image = image.Split(',')[1];
            byte[] imageBytes = Convert.FromBase64String(base64Image);

            var body = MailBody
                .CreateBody(template, footer)
                .Image(@"https://www.thomas-group.com/fileadmin/user_upload/icons_menu/thomas_logo_2018.png", "Thomas Magnete GmbH", new { height = 46, width = 300 })
                .Paragraph("Hey! Wie schön das du bei uns gewesen bist. Hier deine ausgestellte Thomas Emotion Card!")
                .Image("cid:image1", "TEP", new { height = 450, width = 350 })
                .Paragraph("Mit den besten Grüßen")
                .Paragraph("- Thomas Magnete GmbH")
                .ToString();

            Attachment attachment = new Attachment(new MemoryStream(imageBytes), "Screenshot.png", "image/png");  // emotioncard as image
            mailMessage.Attachments.Add(attachment);




            mailMessage.Body = body;

            mailMessage.From = new MailAddress(_mailConfig.SenderMail);
            mailMessage.To.Add(new MailAddress(userMail));


            try
            {
                using (MemoryStream ms = new MemoryStream(imageBytes))
                {


                    AlternateView alternateView = AlternateView.CreateAlternateViewFromString(mailMessage.Body, null, "text/html");
                    alternateView.LinkedResources.Add(new LinkedResource(ms) { ContentId = "image1" });
                    mailMessage.AlternateViews.Add(alternateView);



                    SmtpClient smtpClient = _mailConfig.SmtpClient;
                    smtpClient.Send(mailMessage);
                }
                return true;
            }
            catch
            {
                return false;
            }

        }

        public async Task<bool> IsValidEmail(string email)
        {
            try
            {
                var mailAddress = new MailAddress(email);
                return true;
            }
            catch (FormatException)
            {
                return false;
            }
        }
    }
}
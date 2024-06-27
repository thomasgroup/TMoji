using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

namespace Thomas.TMoji.CrossCutting.Configurations
{
    public class MailConfig : IMailConfig
    {
        public string SenderMail { get; set; }
        public SmtpClient SmtpClient { get; set; }
        public MailConfig(IConfiguration config)
        {
            Int32.TryParse(config.GetSection("MailConfig:Port").Value, out int smtpPort);

            SmtpClient = new SmtpClient()
            {
                Host = config.GetSection("MailConfig:SmtpServer").Value ?? "localHost",
                Port = smtpPort != 0 ? 25 : smtpPort
                //Credentials
            };

            SenderMail = config.GetSection("MailConfig:Email").Value;
        }

    }
}
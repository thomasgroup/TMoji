using Microsoft.Extensions.FileProviders;
using Thomas.TMoji.CrossCutting.Configurations;
using Thomas.TMoji.Logic.TMojiManagement;

namespace Thomas.TMoji.App.WebApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Services.AddSingleton<IConfiguration>(builder.Configuration);


            builder.Services.AddScoped<IMailConfig, MailConfig>();
            builder.Services.AddScoped<MailManager>();

            builder.Services.AddDirectoryBrowser();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            //app.UseAuthorization();
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseDirectoryBrowser();

            app.MapControllers();

            app.Run();
        }
    }
}
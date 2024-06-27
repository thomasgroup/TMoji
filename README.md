# Was ist T-Moji 📝  
  T-Moji ist eine Web-App mit einer KI im Hintergrund, die KI erkennt die Emotionen
  der jeweiligen Personen die vor der Kamera stehen. Anhand deren Emotion werden Emojis
  über ihren Geischtern eingeblendet mit der zugehörigen Emotion. Mit Hilfe der KI kann auch das 
  Alter und Geschlecht ermittelt und Angezeigt werden.
  
## FaceAPI  🤖
  Die FaceAPI ist ein OpenSource Projekt von [@justadudewhohacks](https://github.com/vladmandic).
  Dank der FaceAPI können wir die Emotionen, das Alter und Geschlecht "Predicten". Durch weiter Features der
  FaceAPI können auch die Landmarks eingeblendet werden um zu sehen woran die KI die Emotion ausmacht.
  Diese Feature haben wir in unsere Weboberfläche eingebunden und kann mit einem Button ein und ausgeschaltet werden.


#### Emotionen die erkannt werden:
  - Surprised | Überrascht
  - Disgusted | Angewidert
  - Fearful | Ängstlich
  - Sad | Traurig
  - Angry | Sauer
  - Happy | Fröhlich
  <br>
  <br>
  <br>

  Author: [@vladmandic](https://github.com/vladmandic)
  <br>
  GitHub Projekt: https://github.com/vladmandic/face-api

  
## Emojis und Themes 🔥  
  Um den Nutzer eine Vielfallt zu bieten haben wir mehrere Emojis in verschiedene Themes gezeichnet.
  Zurauswahl haben wir:
  - Normal
  - Batman
  - Mario
  - Naruto
  - One Piece
  - Polizei

  Die Emojis können selbst angepasst werden, durch die dabeiliegenden SVG-Dateien.
  Um ein eigenes Theme einzubinden muss ledeglich nur in der index.html ein neues "menu-item" hinzugefügt werden.
  
#### Wichtiges:

  - Dabei ist zu beachten das die id dem Ordner-Namen unter "wwwroot\images" entspricht.

  ```html
    <div class="menu-item">
        <img src="images/Emojis/Naruto/Happy.png" />
        <button id="Naruto" onclick="SetTheme(this.id)">Naruto</button>
    </div>
  ```

  - Die Bilder-Namen müssen nach den Emotionen benannt werden
  
  ```html
    happy.png
  ```

## Mail Konfiguration
  In der appsettings.json muss der Mail-Server Konfiguriert werden um Mails an andere User zu versenden.
  Das Feature kann in der index.html deaktiviert werden durch das löschen von den zugehörigen HTML-Elementen,
  siehe unten.
  👇
  ```html
    <div class="mb-3 mt-3">
      <label for="email" class="form-label">E-Mail:</label>
      <form autocomplete="off">
          <input type="email" class="form-control" id="email" placeholder="Teile mit deiner Email" name="email">
      </form>
    </div>
  ``` 

  ```html
    <button id="emailBtn" type="button" onclick='sendMail()'><i class="bi bi-envelope-at"></i></button>
  ```

## Deployment
  T-Moji kann dank dem ASP.Net Frameworks auf einer Vielfallt von Plattformen
  gehostet werden, in unserem Fall haben wir T-Moji im IIS von Windows gehostet.
  Eine Dokumentation dazu findest du [hier](https://learn.microsoft.com/en-us/aspnet/core/tutorials/publish-to-iis?view=aspnetcore-7.0&tabs=visual-studio).

#### Requirements
  - .NET 8.0

/* On page load, we get the current language/episode/spoiler level from local
   storage (or from the URL) and draw the page */

window.onload = function ()
{
    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString);

    lang           = urlParams.get("hl") || localStorage.getItem('lang') || "fr";
    episodeOverall = urlParams.get("ep") || parseInt(localStorage.getItem('episode'), 10) || 0;
    spoilerLevel   = urlParams.get("sp") || parseInt(localStorage.getItem('spoiler'), 10) || 0;

    if (lang !== "fr" && lang !== "en")
        lang = "en";

    if (episodeOverall < 0)
        episodeOverall = 0;
    if (episodeOverall > 26)
        episodeOverall = 26;

    if (spoilerLevel < 0)
        spoilerLevel = 0;
    if (spoilerLevel > 26)
        spoilerLevel = 26;

    redrawPage();
}

window.onresize = redrawPage;


/* Event listeners and swipe support */

document.addEventListener("keydown", keyDown);
document.addEventListener("click", reduce);
document.addEventListener("touchend", touchEnd);
document.addEventListener("touchstart", touchStart);

function keyDown(e)
{
    if (e.key === "ArrowRight") {
        e.preventDefault();
        nextEpisode();
    } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        previousEpisode();
    }
}

touchX = 0;
touchY = 0;
startTime = 0;

function touchStart(e)
{
    touchX = e.changedTouches[0].screenX;
    touchY = e.changedTouches[0].screenY;
    startTime = new Date().getTime();
}

function touchEnd(e)
{
    var dx = e.changedTouches[0].screenX - touchX;
    var dy = e.changedTouches[0].screenY - touchY;
    var dtime = new Date().getTime() - startTime;

    if (dtime >= 1000 || Math.abs(dy) >= 50 || Math.abs(dx) <= 50)
        return;

    if (dx < 0)
        nextEpisode();
    else
        previousEpisode();
}


/* Functions to change the current page */

function showSpoiler()
{
    spoilerLevel = episodeOverall;
    localStorage.setItem('spoiler', spoilerLevel);
    redrawPage();
}

function hideSpoiler()
{
    spoilerLevel = episodeOverall - 1;
    localStorage.setItem('spoiler', spoilerLevel);
    redrawPage();
}

function nextEpisode()
{
    if (episodeOverall < 26) {
        episodeOverall++;
        localStorage.setItem('episode', episodeOverall);
        redrawPage();
    }
}

function previousEpisode()
{
    if (episodeOverall >= 1) {
        episodeOverall--;
        localStorage.setItem('episode', episodeOverall);
        redrawPage();
    }
}

function enableFullscreen()
{
    document.body.requestFullscreen().catch(() => {});
    screen.orientation.lock("landscape").catch(() => {});
}

function disableFullscreen()
{
    document.exitFullscreen().catch(() => {});
}

function changeLanguage()
{
    if (lang === "fr")
        lang = "en";
    else
        lang = "fr";

    localStorage.setItem('lang', lang);
    redrawPage();
}


/* Magnifying and reducing */

function magnify(e, obj)
{
    /* We prevent reducing due to clicking on the document */
    e.stopPropagation();

    /* If we clicked on the magnified character, we reduce it */
    if (obj.getAttribute("id") == "magnified") {
        reduce();
        return;
    }

    /* We reduce the (potential) other magnified character */
    reduce();

    /* No enlarging if this episode is unlocked */
    if (episodeOverall > spoilerLevel)
        return;

    /* We compute whether it is out of bounds */
    var bboxOld = obj.getBBox();
    var bbox = {x: bboxOld.x - bboxOld.width, y: bboxOld.y - bboxOld.height,
                width: 3 * bboxOld.width, height: 3 * bboxOld.height};
    var xTranslation = bbox.x < data.left ? data.left - bbox.x :
        (bbox.x + bbox.width > data.right ? data.right - bbox.x - bbox.width : 0);
    var yTranslation = bbox.y < data.top ? data.top - bbox.y :
        (bbox.y + bbox.height > data.bottom ? data.bottom - bbox.y - bbox.height : 0);

    /* We magnify it and translate it to put it in view */
    obj.style.transform = `translate(${xTranslation}px, ${yTranslation}px) scale(3)`;

    /* z-index hack */
    obj.setAttribute("id", "magnified");
}

function reduce()
{
    var magnified = document.getElementById("magnified");

    if (magnified) {
        magnified.style.transform = "";
        magnified.removeAttribute("id");
    }
}


/* Main function that redraws the whole page */

function redrawPage()
{
    var season = 1;
    var episode = episodeOverall;
    if (episodeOverall > 18) {
        season = 3;
        episode = episodeOverall - 18;
    } else if (episodeOverall > 10) {
        season = 2;
        episode = episodeOverall - 10;
    };

    document.title = familyTree[lang];
    document.documentElement.lang = lang;

    /* We load either
       - the current episode if it is unlocked
       - the last unlocked episode
       - episode 1 if no episode has been unlocked yet (it will be blurred anyway)
    */
    loadEpisode(episodeOverall <= spoilerLevel ? episodeOverall : (spoilerLevel || 1));
    initSVG(season, episode);
    computePositions();
    generateSVG();
}


/* Highest implemented episode */
maxImplemented = 18


/* Main function containing all the spoilers. Generates all the data of the corresponding episode */
function loadEpisode(ep)
{
    data = {};

    if (ep <= 0)
        return;
    /* Season 1, episode 1 */

    addCharacter("franziska", ["Franziska Doppler"], "Franziska.jpg", {ax: 2.5, ay: 7});
    addCharacter("charlotte", ["Charlotte Doppler", job.charlotte[lang]], "Charlotte.jpg", {ax: 1.5, ay: 4});
    addCharacter("peter", ["Peter Doppler", job.peter[lang]], "Peter.jpg", {ax: 3.5, ay: 4});
    addCharacter("helge", ["Helge Doppler"], "Helge.jpg", {ax: 2.5, ay: 2});

    addRelation("charlotte", "peter");
    addChild("charlottepeter", "franziska");

    addCharacter("magnus", ["Magnus Nielsen"], "Magnus.jpg", {ax: 5.25, ay: 7});
    addCharacter("martha", ["Martha Nielsen"], "Martha.jpg", {ax: 6.75, ay: 7});
    addCharacter("mikkel", ["Mikkel Nielsen"], "Mikkel.jpg", {ax: 8.25, ay: 7});
    addCharacter("katharina", ["Katharina Nielsen", job.katharina[lang]], "Katharina.jpg", {ax: 5.5, ay: 4});
    addCharacter("ulrich", ["Ulrich Nielsen", job.ulrich[lang]], "Ulrich.jpg", {ax: 8, ay: 4});

    addRelation("ulrich", "katharina");
    addChild("ulrichkatharina", "magnus");
    addChild("ulrichkatharina", "martha");
    addChild("ulrichkatharina", "mikkel");

    addCharacter("mads", ["Mads Nielsen"], {year: 1986, image: "Mads.jpg"}, {ax: 10, ay: 4});
    addCharacter("jana", ["Jana Nielsen"], "Jana.jpg", {ax: 9, ay: 2});

    addChild("jana", "ulrich");
    addChild("jana", "mads");


    addRelation("ulrich", "hannah", {z: 30, dx1: 20, dx2: 20, relationship: "relationship"});

    addCharacter("bartosz", ["Bartosz Tiedemann"], "Bartosz.jpg", {ax: 18.5, ay: 7});
    addCharacter("regina", ["Regina Tiedemann", job.regina[lang]], "Regina.jpg", {ax: 18.5, ay: 4});

    addChild("regina", "bartosz");
    addRelation("martha", "bartosz", {z: 20, dx1: 10, relationship: "relationship"});

    addCharacter("jonas", ["Jonas Kahnwald"], "Jonas.jpg", {ax: 13, ay: 7});
    addCharacter("michael", ["Michael Kahnwald"], "Michael.jpg", {ax: 12, ay: 4});
    addCharacter("hannah", ["Hannah Kahnwald", job.hannah[lang]], "Hannah.jpg", {ax: 14, ay: 4});
    addCharacter("ines", ["Ines Kahnwald"], "Ines.jpg", {ax: 12, ay: 2});

    addRelation("michael", "hannah");
    addChild("michaelhannah", "jonas");

    addRelation("martha", "jonas", {z: 40, dx1: -10, relationship: "broke up"});

    addChild("ines", "michael");

    data.mikkel.images[0].comment = missing[lang];
    data.mads.images[0].comment = missing[lang];
    data.michael.images[0].comment = dead[lang];


    if (ep <= 1)
        return;
    /* Season 1, episode 2 */

    addCharacter("tronte", ["Tronte Nielsen"], "Tronte.jpg", {ax: 10, ay: 2});
    data.jana.ax = 7.5;

    delete data.janaulrich;
    delete data.janamads;

    addRelation("jana", "tronte");
    addChild("janatronte", "ulrich");
    addChild("janatronte", "mads");

    addCharacter("stranger", [stranger[lang]], "TheStranger.jpg", {ax: 20.25, ay: 6.25});

    addCharacter("aleksander", ["Aleksander Tiedemann", job.aleksander[lang]], "Aleksander.jpg", {ax: 20, ay: 4});
    data.regina.ax -= 1.5;

    delete data.reginabartosz;
    addRelation("regina", "aleksander");
    addChild("reginaaleksander", "bartosz");

    data.mikkel.images[0].comment = inn[lang] + " 1986";

    addPhotoBefore("ulrich", "UlrichYoung.jpg");
    addPhotoBefore("katharina", "KatharinaYoung.jpg");


    if (ep <= 2)
        return;
    /* Season 1, episode 3 */

    addPhotoBefore("charlotte", "CharlotteYoung.jpg");
    addPhotoBefore("helge", "HelgeAdult.jpg");
    addCharacter("bernd", ["Bernd Doppler", job.bernd[lang]], {year: 1986, image: "Bernd.jpg"}, {ax: 2.5, ay: 0});

    addPhotoBefore("jana", "JanaAdult.jpg");
    addPhotoBefore("tronte", "TronteAdult.jpg");

    data.ines.ax += 0.5;
    data.ines.names[1] = job.ines[lang];
    addPhotoBefore("ines", "InesYoung.jpg");
    addPhotoBefore("hannah", "HannahYoung.jpg");

    addPhotoBefore("regina", "ReginaYoung.jpg");
    addCharacter("claudia", ["Claudia Tiedemann", job.claudia[lang]], {year: 1986, image: "Claudia.jpg"}, {ax: 17, ay: 2});

    addChild("claudia", "regina");
    addCharacter("egon", ["Egon Tiedemann", job.egon[lang]], {year: 1986, image: "Egon.jpg"}, {ax: 17, ay: 0});


    if (ep <= 3)
        return;
    /* Season 1, episode 4 */

    addCharacter("elisabeth", ["Elisabeth Doppler"], "Elisabeth.jpg", {ax: 1.5, ay: 7});
    data.charlotte.children = ["franziska", "elisabeth"];
    data.peter.children = ["franziska", "elisabeth"];
    data.franziska.ax += 1;
    addChild("charlottepeter", "elisabeth");

    addChild("helge", "peter");

    addRelation("magnus", "franziska", {relationship: "relationship"});


    if (ep <= 4)
        return;
    /* Season 1, episode 5 */

    addCharacter("noah", ["Noah"], "Noah.jpg", {ax: 15.5, ay: 6.25});

    data.ulrichhannah.relationship = "broke up";
    data.ulrichhannah.z = 20;
    data.ulrichhannah.dx1 = 20;
    data.ulrichhannah.dx2 = -20;

    delete data.michael;
    delete data.inesmichael;
    delete data.michaelhannah;
    delete data.michaelhannahjonas;

    addPhotoAfter("mikkel", {year: 2019, image: "Michael.jpg"});
    data.mikkel.names = ["Mikkel Nielsen", "Michael Kahnwald"];
    data.mikkel.ay -= 0.80;
    data.mikkel.ax += 2.75;
    data.mikkel.images[1].comment = dead[lang];
    data.mikkel.images[0].year = 1986;

    data.jonas.ax = 12.5;
    data.jonas.ay += 1.20;
    data.marthajonas.z = 20;
    data.martha.ax += 1;

    addRelation("mikkel", "hannah");
    addChild("mikkelhannah", "jonas");
    addChild("ines", "mikkel", {dy: 240, dx: 10});
    data.ulrichkatharinamikkel.dx = -10;


    if (ep <= 5)
        return;
    /* Season 1, episode 6 */

    data.mads.images[0].comment = dead[lang];
    data.jonas.images[0].comment = inn[lang] + " 1986";

    addRelation("tronte", "claudia", {dx1: 20, dx2: -20, relationship: "broke up"});


    if (ep <= 6)
        return;
    /* Season 1, episode 7 */

    data.helge.names[1] = job.helge[lang];
    addPhotoBefore("helge", {year: 1953, image: "HelgeYoung.jpg"});

    delete data.jonas.images[0].comment;


    if (ep <= 7)
        return;
    /* Season 1, episode 8 */

    addCharacter("greta", ["Greta Doppler"], {year: 1953, image: "Greta.jpg"}, {ax: 1, ay: 0});
    addPhotoBefore("bernd", {year: 1953, image: "BerndAdult.jpg"});
    data.bernd.ax += 1.5;
    addRelation("greta", "bernd");
    addChild("gretabernd", "helge");

    addCharacter("agnes", ["Agnes Nielsen"], {year: 1953, image: "Agnes.jpg"}, {ax: 10, ay: 0});
    addChild("agnes", "tronte");
    addPhotoBefore("tronte", {year: 1953, image: "TronteYoung.jpg"});
    data.jana.ax -= 0.5;
    data.ines.ax += 0.5;

    addPhotoBefore("egon", {year: 1953, image: "EgonAdult.jpg"});
    addPhotoBefore("claudia", {year: 1953, image: "ClaudiaYoung.jpg"});
    addCharacter("doris", ["Doris Tiedemann"], {year: 1953, image: "Doris.jpg"}, {ax: 16, ay: 0});
    addRelation("doris", "egon");
    addChild("dorisegon", "claudia");
    data.egon.ax += 1;

    addCharacter("tannhaus", ["H.G. Tannhaus"], {year: 1986, image: "HGTannhaus.jpg"}, {ax: 13.5, ay: 0});
    addPhotoBefore("tannhaus", {year: 1953, image: "HGTannhausAdult.jpg"});

    data.ulrich.images[1].comment = inn[lang] + " 1953";

    data.inesmikkel.dx1 = -30;


    if (ep <= 8)
        return;
    /* Season 1, episode 9 */

    addPhotoBefore("aleksander", {year: 1986, image: "AleksanderYoung.jpg"});
    data.aleksander.names[0] = "Boris Niewald";
    data.aleksander.names[2] = data.aleksander.names[1];
    data.aleksander.names[1] = "Aleksander Tiedemann (Köhler)";

    addPhotoAfter("claudia", {year: 2019, image: "ClaudiaOld.jpg"});


    if (ep <= 9)
        return;
    /* Season 1, episode 10 */

    data.helge.images[2].comment = dead[lang];
    data.jonas.images[0].comment = inn[lang] + " 2052";
    addPhotoAfter("jonas", {year: 2019, image: "TheStranger.jpg"});
    delete data.stranger;


    if (ep <= 10)
        return;
    /* Season 2, episode 1 */

    data.marthabartosz.relationship = "broke up";

    addPhotoBefore("noah", {year: 1920, image: "NoahYoung.jpg"});
    data.noah.images[1].year = 1953;

    addCharacter("adam", ["Adam"], {year: 1920, image: "Adam.jpg"}, {ax: 20.25, ay: 1});

    addPhotoAfter("elisabeth", {year: 2052, image: "ElisabethAdult.jpg"});

    data.greta.names[0] = "Greta Doppler";
    data.doris.names[0] = "Doris Tiedemann";

    data.ulrich.images[1].comment = inn[lang] + " 1954";
    data.mikkel.images[0].comment = inn[lang] + " 1987";
    data.jonas.images[0].comment = inn[lang] + " 2053";

    data.regina.images[1].image = "Regina2.jpg";


    if (ep <= 11)
        return;
    /* Season 2, episode 2 */

    data.tronteclaudia.dx1 = 120;

    addPhotoAfter("ulrich", {year: 1986, image: "UlrichOld.jpg"});
    data.ulrich.images[2].comment = inn[lang] + " 1987";
    data.ulrich.images[1].year = 1953;
    data.ulrich.ax += 0.5;
    data.mads.ax += 1;

    data.regina.images[0].image = "ReginaYoung2.jpg";


    if (ep <= 12)
        return;
    /* Season 2, episode 3 */

    addRelation("doris", "agnes", {dx1: -20, dx2: 20, relationship: "relationship"});

    data.noah.ay = 0;
    data.noah.ax = 7.25;
    addSiblings("agnes", "noah");

    data.claudia.images[2].comment = deadF[lang];


    if (ep <= 13)
        return;
    /* Season 2, episode 4 */

    data.jonas.images[0].comment = inn[lang] + " 1921";

    addPhotoBefore("agnes", {year: 1920, image: "AgnesYoung.jpg"});

    delete data.adam;
    addPhotoAfter("jonas", {year: 1920, image: "Adam.jpg"});
    data.jonas.names[1] = "Adam";


    if (ep <= 14)
        return;
    /* Season 2, episode 5 */

    addChild("noah", "charlotte", {dy: 230, showFirst: true});


    if (ep <= 15)
        return;
    /* Season 2, episode 6 */

    data.jonas.images[0].comment = "";

    addPhotoAfter("magnus", {year: 1920, image: "MagnusAdult.jpg"});
    addPhotoAfter("franziska", {year: 1920, image: "FranziskaAdult.jpg"});

    data.franziska.ax += 0.5;
    data.magnus.ax += 1.25;
    data.martha.ax += 1;


    if (ep <= 16)
        return;
    /* Season 2, episode 7 */

    data.hannah.images[1].comment = inn[lang] + " 1954";
    data.hannah.images[1].year = 1953;
    data.egon.images[1].comment = dead[lang];


    if (ep <= 17)
        return;
    /* Season 2, episode 8 */

    addRelation("noah", "elisabeth", {z: 40, dx1: 0, showFirst: true});
    delete data.noahcharlotte
    addChild("noahelisabeth", "charlotte", {dx: -125, dxx:0, showFirst: true});

    data.noah.images[1].comment = dead[lang];
    data.martha.images[0].comment = deadF[lang];
    data.claudia.images[1].comment = inn[lang] + " 2020";

    addPhotoAfter("martha", {year: 2019, image: "MarthaOther.jpg", otherworld: true});


    if (ep <= 18)
        return;
    /* Season 3, episode 1 */
}


/* Utility functions when adding new data */

function addCharacter(label, names, image, position)
{
    if (typeof(image) === "string")
        image = {year:2019, image: image};

    data[label] = {type: "character", names: names, images: [image]};
    Object.assign(data[label], position);
}

function addRelation(label1, label2, d = {})
{
    data[label1+label2] = {type: "relation", label1: label1, label2: label2, z: d.z || 20, dx1: d.dx1 || 0,
                           dx2: d.dx2 || 0, relationship: d.relationship || "married",
                           showFirst: d.showFirst || false};
}

function addChild(parents, child, d = {})
{
    data[parents+child] = {type: "child", parents: parents, child: child, dy: d.dy || 20, dx: d.dx || 0,
                           showFirst: d.showFirst || false, dxx: d.dxx};
}

function addSiblings(label1, label2)
{
    data[label1+label2] = {type: "siblings", label1: label1, label2: label2};
}

function addPhotoBefore(label, image)
{
    if (typeof(image) === "string")
        image = {year: 1986, image: image};

    data[label].images.unshift(image);
}

function addPhotoAfter(label, image)
{
    if (typeof(image) === "string")
        image = {year: 1986, image: image};

    data[label].images.push(image);
}


/* Localized strings */

job =
    {charlotte: {en: "(police officer)",
                 fr: "(policière)"},
     peter: {en: "(psychologist)",
             fr: "(psychologue)"},
     katharina: {en: "(school rector)",
                 fr: "(directrice d’école)"},
     ulrich: {en: "(police officer)",
              fr: "(policier)"},
     hannah: {en: "(massage therapist)",
              fr: "(masseuse)"},
     regina: {en: "(hotel owner)",
              fr: "(propriétaire d’hôtel)"},
     aleksander: {en: "(nuclear plant director)",
                  fr: "(directeur de la centrale)"},
     bernd: {en: "(old director of the nuclear plant)",
             fr: "(ancien directeur de la centrale)"},
     ines: {en: "(nurse)",
            fr: "(infirmière)"},
     claudia: {en: "(new director of the nuclear plant)",
               fr: "(nouvelle directrice de la centrale)"},
     egon: {en: "(police officer)",
            fr: "(policier)"},
     helge: {en: "(guard at the nuclear plant)",
             fr: "(garde à la centrale)"}}

stranger = {en: "The stranger", fr: "L’étranger"}
missing = {en: "missing", fr: "disparu"}
dead = {en: "dead", fr: "mort"}
deadF = {en: "dead", fr: "morte"}
inn = {en: "in", fr: "en"}
familyTree = {en: "Dark Family Tree",
              fr: "Arbre généalogique de Dark"}
seasonTxt = {en: "Season", fr: "Saison"}
episodeTxt = {en: "Episode", fr: "épisode"}

copyrightNetflix =  {en: "Images and characters by", fr: "Images et personnages par"}
copyrightMe = {en: "Design of this page by", fr: "Conception de cette page par"}

showSpoilersFor = {en: "Show spoilers for", fr: "Afficher les spoilers pour"}
thisEpisode = {en: {true: "this episode?", false: "this episode and those before?"},
               fr: {true: "cet épisode?", false: "cet épisode et les précédents?"}}

hideSpoilers = {en: "hide spoilers", fr: "cacher les spoilers"}

instructions =
    {en:
     ["Welcome to my spoiler-free guide to the characters of the series Dark.",
      "- Next episode: Right arrow key or swipe left",
      "- Previous episode: Left arrow key or swipe right"],
     fr:
     ["Bienvenue sur mon guide sans spoiler des charactères de la série Dark.",
      "- Épisode suivant : Flèche droite du clavier ou swipe à gauche",
      "- Épisode précédent : Flèche gauche du clavier or swipe à droite"]
    }
instructions2 = {en: "- Error or technical issue:",
                 fr: "- Erreur ou problème technique :"}
instructions3 = {en: "Contact me",
                 fr: "Contactez-moi"}


/* Set up the UI and prepare the SVG */

function initSVG(season, episode)
{
    /* Set the viewBox (constant for now, may change for season 3) */
    document.getElementById("tree").setAttribute("viewBox", `0 -190 2150 1140`);

    /* Set up the bounds of the SVG */
    var bbox = calculateViewport(document.getElementById("tree"));
    data.left = bbox.x + 25;
    data.right = bbox.width + bbox.x - 25;
    data.top = bbox.y + 25;
    data.bottom = bbox.height + bbox.y - 25;
    data.hFactor = bbox.width/2150 * 100;

    /* Repeated background image */
    svgCode = `<image href="photos/background${season}.jpg" x="0" y="-190" width="${bbox.width/3}"
                      height="1140" preserveAspectRatio="none" filter="url(#backgroundBlur)"/>`
        +     `<image href="photos/background${season}.jpg" x="${bbox.width/3}" y="-190" width="${bbox.width/3}"
                      height="1140" preserveAspectRatio="none" filter="url(#backgroundBlur)"/>`
        +     `<image href="photos/background${season}.jpg" x="${2*bbox.width/3}" y="-190" width="${bbox.width/3}"
                      height="1140" preserveAspectRatio="none" filter="url(#backgroundBlur)"/>`;

    if (episodeOverall >= 1) {
        /* Titlebar */
        uiCode = `<text x="${bbox.width/2}" y="-140" font-size="40" class="title">
                    ${familyTree[lang]} : ${seasonTxt[lang]} ${season}, ${episodeTxt[lang]} ${episode}
                  </text>`;
    }
    else {
        /* Background image for the main page */
        uiCode = `<image href="photos/background.jpg" x="0" y="-190" width="${bbox.width}"
                         height="1140" preserveAspectRatio="none" filter="url(#background)"/>`;

        /* Titlebar of the main page */
        uiCode += `<text x="${bbox.width/2}" y="-120" font-size="80" class="title">${familyTree[lang]}</text>`

        /* Instructions */
        uiCode += `<text y="160" font-size="40" class="instructions">`
        for (const line of instructions[lang])
            uiCode += `<tspan x="150" dy="90">${line}</tspan>`;
        uiCode += `<tspan x="150" dy="90">${instructions2[lang]} <a href="mailto:guillaume.brunerie@gmail.com">${instructions3[lang]}</a>
                   </tspan>`;
        uiCode += `</text>`
    }

    /* Language change button */
    uiCode +=
        `<a href="#" onclick="changeLanguage();"><image href="photos/${(lang == "en") ? "fr" : "en"}.png"
            x="${bbox.width - 75}" y="-165" width="50" height="50"/></a>`

    /* Netflix credits */
    uiCode +=
        `<text x="${data.right}" y="910" class="copyright">
           ${copyrightNetflix[lang]} <a href="https://www.netflix.com/title/80100172">Netflix</a>
         </text>`

    /* Personal credits */
    uiCode +=
        `<text x="${data.right}" y="930" class="copyright">
          ${copyrightMe[lang]} <a href="https://guillaumebrunerie.github.io">Guillaume Brunerie</a>
         </text>`;

    /* Fullscreen button */

    /* Display the button bigger in portait mode */
    var scaling = "";
    if (bbox.height > bbox.width)
        scaling = `transform="translate(${-2*data.right - 10} ${-2*850 + 25}) scale(3)"`

    if (document.fullscreenElement == null)
        uiCode +=
          `<g ${scaling}><a href="#" onclick="enableFullscreen()">
             <rect x="${data.right - 52}" y="800" width="54" height="49" stroke="black" stroke-width="2" rx="5" fill="darkgrey"/>
             <path d="M ${data.right - 25} 827 m -10   5 l -10  10 v -10 M ${data.right - 25} 827 m -10   5 l -10  10 h  10" stroke="black" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
             <path d="M ${data.right - 25} 827 m  10   5 l  10  10 v -10 M ${data.right - 25} 827 m  10   5 l  10  10 h -10" stroke="black" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
             <path d="M ${data.right - 25} 827 m  10 -10 l  10 -10 v  10 M ${data.right - 25} 827 m  10 -10 l  10 -10 h -10" stroke="black" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
             <path d="M ${data.right - 25} 827 m -10 -10 l -10 -10 v  10 M ${data.right - 25} 827 m -10 -10 l -10 -10 h  10" stroke="black" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
           </a>`;
    else
        uiCode +=
          `<a href="#" onclick="disableFullscreen()">
             <rect x="${data.right - 52}" y="800" width="54" height="49" stroke="black" stroke-width="2" rx="5" fill="darkgrey"/>
             <path d="M ${data.right - 25} 827 m -20  15 l  10 -10 v  10 M ${data.right - 25} 827 m -20  15 l  10 -10 h -10" stroke="black" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
             <path d="M ${data.right - 25} 827 m  20  15 l -10 -10 v  10 M ${data.right - 25} 827 m  20  15 l -10 -10 h  10" stroke="black" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
             <path d="M ${data.right - 25} 827 m  20 -20 l -10  10 v -10 M ${data.right - 25} 827 m  20 -20 l -10  10 h  10" stroke="black" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
             <path d="M ${data.right - 25} 827 m -20 -20 l  10  10 v -10 M ${data.right - 25} 827 m -20 -20 l  10  10 h -10" stroke="black" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
           </a></g>`;

    /* Button to hide spoilers */
    if (episodeOverall <= spoilerLevel && episodeOverall >= 1)
        uiCode += `<a href="#" onclick="hideSpoiler();"><text x="${bbox.width - 125}" y="-140" font-size="20"
                      class="title" style="text-anchor:end">(${hideSpoilers[lang]})</text></a>`;

    /* Cancel blur effect if present */
    document.getElementById("treeContents").classList.add("enabled");

    /* "Not implemented yet" page */
    if (episodeOverall > maxImplemented) {
        document.getElementById("treeContents").classList.remove("enabled");
        uiCode +=
            `<text x="${bbox.width/2}" y="400" font-size="80" class="title" style="stroke-width:5px">
               Not implemented yet :(
             </text>`;
        return;
    }

    /* "Show spoilers" page */
    if (episodeOverall > spoilerLevel) {
        document.getElementById("treeContents").classList.remove("enabled");

        var immediateSpoiler = (episodeOverall == spoilerLevel + 1);
        uiCode +=
            `<text x="${bbox.width/2}" y="150" font-size="80" class="title" style="stroke-width:5px">
               ${showSpoilersFor[lang]}
             </text>
             <text x="${bbox.width/2}" y="250" font-size="80" class="title" style="stroke-width:5px">
               ${thisEpisode[lang][immediateSpoiler]}
             </text>`;

        /* Eye button */
        uiCode +=
            `<g class="button" onclick="showSpoiler();">
               <g>
                 <path d="M ${bbox.width/2 - 100} 470 a 200 350 0 0 1 200 0 a 200 350 0 0 1 -200 0 z"
                       stroke="black" stroke-width="22" fill="lightgrey""/>
                 <path d="M ${bbox.width/2 - 100} 470 a 200 350 0 0 1 200 0 a 200 350 0 0 1 -200 0 z"
                       stroke="lightgrey" stroke-width="16" fill="lightgrey"/>
                 <path d="M ${bbox.width/2 - 100} 470 a 200 350 0 0 1 200 0 a 200 350 0 0 1 -200 0 z"
                       stroke="black" stroke-width="10" fill="lightgrey"/>
                 <circle cx="${bbox.width/2}" cy="470" r="45" stroke="black" stroke-width="10" fill="darkgrey"/>
                 <circle cx="${bbox.width/2}" cy="470" r="16" stroke="black" stroke-width="10" fill="black"/>
                 <circle cx="${bbox.width/2 + 8}" cy="462" r="6" stroke="lightgrey" stroke-width="10" fill="lightgrey"/>
               </g>
             </g>`
    }
}


/* Compute the exact position of every element */

function computePosition(label)
{
    var d = data[label];

    /* Return early if the position has already been computed */
    if (d.x !== undefined)
        return;

    if (d.type === "character") {
        /* Compute the height */
        d.bottomHeight = 10 + 20 * d.names.length;

        /* Compute the actual position */
        d.x = d.ax * data.hFactor;
        d.y = d.ay * 100;

    } else if (d.type === "relation") {
        /* Compute the position of the parent nodes, and then all the other required data */
        computePosition(d.label1);
        computePosition(d.label2);

        d.x1 = data[d.label1].x + d.dx1;
        d.x2 = data[d.label2].x + d.dx2;
        d.y1 = data[d.label1].y + 50 + data[d.label1].bottomHeight;
        d.y2 = data[d.label2].y + 50 + data[d.label2].bottomHeight;
        d.yM = Math.max(d.y1, d.y2) + d.z;

        d.x = (d.x1 + d.x2)/2;
    } else if (d.type === "child") {
        /* Compute the position of the parent nodes, and then all the other required data */
        computePosition(d.parents);
        computePosition(d.child);

        d.x1 = data[d.parents].x + (d.dx1 || 0);
        d.y1 = data[d.parents].yM || data[d.parents].y + 50 + data[d.parents].bottomHeight;
        d.x2 = data[d.child].x + d.dx;
        d.y2 = data[d.child].y - 60;

        if (d.dxx !== undefined)
            d.x3 = data[d.child].x + d.dxx;
    } else if (d.type === "siblings") {
        /* Compute the position of the parent nodes, and then all the other required data */
        computePosition(d.label1);
        computePosition(d.label2);

        d.x1 = data[d.label1].x;
        d.x2 = data[d.label2].x;
        d.y1 = data[d.label1].y - 60;
        d.y2 = data[d.label2].y - 50;
    }
}

function computePositions()
{
    for (label in data)
        computePosition(label);
}


/* Generate the main tree, from the already computed positions */

function generateSVG()
{
    for (label in data)
        if (data[label].showFirst)
            displayElement(data[label]);

    for (label in data)
        if (!data[label].showFirst)
            displayElement(data[label]);

    document.querySelector("#treeContents").innerHTML = svgCode;
    document.querySelector("#treeUI").innerHTML = uiCode;

    /* Adapt the sizes of comment boxes */
    for (const element of document.getElementsByClassName("comment")) {
        var bbox = element.getBBox();
        var rectangle = document.getElementById("R" + element.id.substring(1));
        rectangle.setAttribute("width", bbox.width + 10);
        rectangle.setAttribute("x", bbox.x - 5);
    }
}

function displayElement(d)
{
    if (d.type === "relation")
        displayRelation(d.x1, d.x2, d.y1, d.y2, d.yM, d.relationship);
    else if (d.type === "child")
        displayChild(d.x1, d.x2, d.y1, d.y2, d.dy, d.x3);
    else if (d.type === "siblings")
        displaySiblings(d.x1, d.x2, d.y1, d.y2);
    else if (d.type === "character")
        displayPerson(d.x, d.y, d.names, d.images);
}


/* Generate the SVG code for a character, with its images and names */

dasharrays = {2085: "20 3",
              2052: "9 3",
              2019: "",
              1986: "6",
              1953: "3 9",
              1920: "3 19"}

function displayPerson(x, y, names, images)
{
    svgCode += `<g class="button" onclick="magnify(arguments[0], this)">`;

    /* Background rectangle */
    svgCode += `<rect x="${x - images.length * 53 - 1}" y="${y - 54}" width="${106 * images.length + 2}"
                      height="${108}" fill="black" rx="6"/>`;

    for (var i in images) {
        /* The image itself */
        var currentX = x - images.length * 53 + i * 106 + 3;
        svgCode += `<image x="${currentX}" y="${y - 50}" width="100" height="100" preserveAspectRatio="none"
                          href="photos/${images[i].image}"/>`;

        /* The border of the image */

        var color = "lightgrey";
        if (images[i].otherworld)
            color = "purple";

        da = dasharrays[images[i].year];

        svgCode += `<rect x="${currentX}" y="${y - 50}" width="100" height="100" rx="3" stroke-dasharray="${da}"
                         fill="none" stroke-width="3" stroke="${color}"/>`;

        /* The comment, if there is one */
        if (images[i].comment) {
            var commentColor = "purple";
            if (images[i].comment === missing[lang])
                commentColor = "red";
            if (images[i].comment === dead[lang] || images[i].comment === deadF[lang])
                commentColor = "darkred";
            if (images[i].comment === inn[lang] + " 1921")
                commentColor = "black";
            if (images[i].comment === inn[lang] + " 1953")
                commentColor = "darkcyan";
            if (images[i].comment === inn[lang] + " 1954")
                commentColor = "darkcyan";
            if (images[i].comment === inn[lang] + " 1986")
                commentColor = "blue";
            if (images[i].comment === inn[lang] + " 1987")
                commentColor = "blue";
            if (images[i].comment === inn[lang] + " 2052")
                commentColor = "green";
            if (images[i].comment === inn[lang] + " 2053")
                commentColor = "green";

            svgCode += `<rect x="${currentX - 30 + 50}" y="${y + 28}" width="60" height="18" rx="5"
                              stroke-width="2" stroke="${commentColor}" fill="darkgrey"
                              id="${"R" + Math.round(x) + "_" + Math.round(y) + "_" + i}"/>`;
            svgCode += `<text x="${currentX + 50}" y="${y + 37}" font-size="12" class="comment"
                              id="${"T" + Math.round(x) + "_" + Math.round(y) + "_" + i}">
                          ${images[i].comment}
                        </text>`;
        }
    }

    /* The names */
    for (var i in names) {
        svgCode += `<text x="${x}" y="${y + 70 + 20 * i}" class="name">${names[i]}</text>`;
    }

    svgCode += `</g>`;
}

function displayRelation(x1, x2, y1, y2, yM, relationship)
{
    var dasharray = "";
    var w = 2;
    if (relationship === "married")
        w = 3;
    if (relationship === "relationship")
        dasharray = `stroke-dasharray="7 3"`;
    if (relationship === "broke up")
        dasharray = `stroke-dasharray="2 8"`;

    svgCode += `<path d="M ${x1} ${y1} V ${yM} H ${x2} V ${y2}"
                       stroke="lightgrey" stroke-width="${w}" fill="none" ${dasharray}></path>`;
}

function displaySiblings(x1, x2, y1, y2)
{
    svgCode += `<path d="M ${x1} ${y1} v -20 H ${x2} v 20"
                      stroke="lightgrey" stroke-width="3" fill="none"></path>`;
}

function displayChild(x1, x2, y1, y2, dy, x3)
{
    if (x3 != undefined)
        svgCode += `<path d="M ${x1} ${y1} v ${dy} H ${x2} V ${y2 - 20} H ${x3} v 20"
                          stroke="lightgrey" stroke-width="3" fill="none"/>`;

    svgCode += `<path d="M ${x1} ${y1} v ${dy} H ${x2} V ${y2}" stroke="lightgrey" stroke-width="3" fill="none"/>`;
}


/* Utility function taken from
   https://stackoverflow.com/questions/23664967/determining-the-svg-viewport-in-global-root-coordinates */

// Given an <svg> element, returns an object with the visible bounds
// expressed in local viewBox units, e.g.
// { x:-50, y:-50, width:100, height:100 }
function calculateViewport(svg){ // http://phrogz.net/JS/_ReuseLicense.txt
  var style    = getComputedStyle(svg),
      owidth   = parseInt(style.width,10),
      oheight  = parseInt(style.height,10),
      aspect   = svg.preserveAspectRatio.baseVal,
      viewBox  = svg.viewBox.baseVal,
      width    = viewBox && viewBox.width  || owidth,
      height   = viewBox && viewBox.height || oheight,
      x        = viewBox ? viewBox.x : 0,
      y        = viewBox ? viewBox.y : 0;
  if (!width || !height || !owidth || !oheight) return;
  if (aspect.align==aspect.SVG_PRESERVEASPECTRATIO_NONE || !viewBox || !viewBox.height){
    return {x:x,y:y,width:width,height:height};
  }else{
    var inRatio  = viewBox.width / viewBox.height,
        outRatio = owidth / oheight;
    var meetFlag = aspect.meetOrSlice != aspect.SVG_MEETORSLICE_SLICE;
    var fillAxis = outRatio>inRatio ? (meetFlag?'y':'x') : (meetFlag?'x':'y');
    if (fillAxis=='x'){
      height = width/outRatio;
      var diff = viewBox.height - height;
      switch (aspect.align){
        case aspect.SVG_PRESERVEASPECTRATIO_UNKNOWN:
        case aspect.SVG_PRESERVEASPECTRATIO_XMINYMID:
        case aspect.SVG_PRESERVEASPECTRATIO_XMIDYMID:
        case aspect.SVG_PRESERVEASPECTRATIO_XMAXYMID:
          y += diff/2;
        break;
        case aspect.SVG_PRESERVEASPECTRATIO_XMINYMAX:
        case aspect.SVG_PRESERVEASPECTRATIO_XMIDYMAX:
        case aspect.SVG_PRESERVEASPECTRATIO_XMAXYMAX:
          y += diff;
        break;
      }
    }
    else{
      width = height*outRatio;
      var diff = viewBox.width - width;
      switch (aspect.align){
        case aspect.SVG_PRESERVEASPECTRATIO_UNKNOWN:
        case aspect.SVG_PRESERVEASPECTRATIO_XMIDYMIN:
        case aspect.SVG_PRESERVEASPECTRATIO_XMIDYMID:
        case aspect.SVG_PRESERVEASPECTRATIO_XMIDYMAX:
          x += diff/2;
        break;
        case aspect.SVG_PRESERVEASPECTRATIO_XMAXYMID:
        case aspect.SVG_PRESERVEASPECTRATIO_XMAXYMIN:
        case aspect.SVG_PRESERVEASPECTRATIO_XMAXYMAX:
          x += diff;
        break;
      }
    }
    return {x:x,y:y,width:width,height:height};
  }
}

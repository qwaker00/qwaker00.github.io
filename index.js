var myLittleKey = 'dict.1.1.20131206T180810Z.387a0a6a87fac43a.fb9e2be319aac3d30aa84f37a8d403c459467043'
var mySecondKey = 'trnsl.1.1.20131206T180307Z.4f4d2fade79d9890.63e6474a9bad71c3e1e6e82565436a02770b5b11'

var lock = 0;

function showLoading() {
    lock = 1;
    $('#loading').css('display', 'inline-block');
    $('#request_submit').attr('disabled', true).css('cursor', 'default');
    $('#request_paste').css('cursor', 'default');
    $('#request_input').attr('disabled', true);
}

function hideLoading() {
    lock = 0;
    $('#loading').css('display', 'none');
    $('#request_submit').removeAttr('disabled').css('cursor', 'pointer');
    $('#request_paste').css('cursor', 'pointer');
    $('#request_input').removeAttr('disabled');
}

function sayIt(s) {
    $('embed').filter('[temp="true"]').remove();
    $('<embed temp="true" loop="false" autostart="true" hidden="true" src="http://tts-api.com/tts.mp3?q=' + encodeURI($(this).attr('phrase')) + '"/>').appendTo('body');
}

function requestTranslation(text, lang) {
    var output = $('#response');
    $.get('https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=' + encodeURI(myLittleKey) + '&lang=' + encodeURI(lang) + '&ui=ru&text=' + encodeURI(text),
        function(response) {
            console.log(response);
            if (response.def && response.def.length > 0) {
                output.children().filter('div').remove();
                for (var i = 0; i < response.def.length; ++i) {
                    var variant = $('<div/>', {class : 'variant'}).appendTo(output);
                    var def = response.def[i];

                    if (!def.text) continue;

                    var main = $('<div/>', {class : 'variant_main'}).appendTo(variant);
                    var translations = $('<div/>', {class : 'variant_trans'}).appendTo(variant);

                    $('<div/>', {class: 'text'}).text(def.text).appendTo(main);
                    
                    if (def.ts)
                        $('<div/>', {class: 'ts'}).text('[' + def.ts + ']').appendTo(main);

                    if (lang.substring(0, 2) == 'en') $('<div/>', {class: 'say', 'phrase': def.text}).text('.').click(sayIt).appendTo(main);

                    if (def.pos)
                        $('<div/>', {class: 'pos'}).text(def.pos).appendTo(main);

                    if (def.tr && def.tr.length > 0)
                    for (var j = 0; j < def.tr.length; ++j) {
                        var translation = $('<div/>', {class : 'translation'}).appendTo(translations);
                        var tr = def.tr[j];

                        if (!tr.text) continue;

                        $('<div/>', {
                            class: 'text'
                        }).text(tr.text).attr('title', 'Скопировать "' + tr.text + '" в буфер обмена (НЕ РАБОТАЕТ)').appendTo(translation).click(copy);

                        if (tr.syn) {
                            for (var k = 0; k < tr.syn.length; ++k) {
                                $('<span/>', {class: 'separator'}).text(', ').appendTo(translation);
                                $('<div/>', {class: 'text'}).attr('title', 'Скопировать "' + tr.syn[k].text + '" в буфер обмена (НЕ РАБОТАЕТ)').text(tr.syn[k].text).appendTo(translation).click(copy);
                            }
                        }
                        if (tr.ex) {
                            var examples = $('<div/>', {class : 'examples'}).appendTo(translation);
                            for (var k = 0; k < tr.ex.length; ++k) {
                                $('<div/>', {class: 'ex'}).text(tr.ex[k].text + ' - ' + tr.ex[k].tr[0].text).appendTo(examples);
                            }
                        }
                    }
                }
                hideLoading();
            } else {
                $.get('https://translate.yandex.net/api/v1.5/tr.json/translate?key=' + encodeURI(mySecondKey) + '&lang=' + lang.substring(3, 5) + '&format=plain&options=1&text=' + encodeURI(text),
                function(response) {
                    if (response.code == 200 && response.text != text && response.detected && response.detected.lang in langNameOm) {
                        output.children().filter('div').remove();
                        $('<div class="maybe">Возможно это означает <i>"' + response.text[0] + '"</i> на ' + langNameOm[response.detected.lang] + ' языке</div>').appendTo(output);
                        hideLoading();                        
                    } else {
                        output.children().filter('div').remove();
                        $('<div/>', {class : 'error'}).text('Простите, но мы не знаем перевод этого слова').appendTo(output);        
                        hideLoading();
                    }
                }
                ).error(function() {
                    output.children().filter('div').remove();
                    $('<div/>', {class : 'error'}).text('Ошибка соединения, попробуйте еще раз').appendTo(output);        
                    hideLoading();
                });
            }
        }
    ).error(function() {
        output.children().filter('div').remove();
        $('<div/>', {class : 'error'}).text('Ошибка соединения, попробуйте еще раз').appendTo(output);        
        hideLoading();
    });
}

function request() {
    if (lock) return;

    var text = $('#request_input').val().trim();

    if (text.length == 0) {
        alert("Введите слово для перевода");
        return;
    }

    var output = $('#response');
    showLoading();

    var from = $('#langs_from').val();
    var to = $('#langs_to').val();
    if (from == 'detect') {
        $.get('https://translate.yandex.net/api/v1.5/tr.json/detect?key=' + encodeURI(mySecondKey) + '&text=' + encodeURI(text),
            function(r) {
                console.log(r);
                if (r.code == 200 && r.lang in goodTranslations) {
                    var langsFrom = $('#langs_from');
                    var langsTo = $('#langs_to');
                    langsFrom.val(r.lang);
                    console.log(langsFrom.val());
                    langSelect.call(langsFrom);
                    langsTo.val('ru');
                    requestTranslation(text, r.lang + '-' + to);
                } else {
                    output.children().filter('div').remove();
                    $('<div/>', {class : 'error'}).text('Простите, но мы не смогли определить язык слова').appendTo(output);
                }
                hideLoading();
            }
        ).error(function() {
            output.children().filter('div').remove();
            $('<div/>', {class : 'error'}).text('Ошибка соединения, попробуйте еще раз').appendTo(output);        
            hideLoading();
        });
    } else {
        requestTranslation(text, from + '-' + to);
    }
}

var langName = {
    'ru' : 'русский',
    'en' : 'английский',
    'pl' : 'польский',
    'uk' : 'украинский',
    'de' : 'немецкий',
    'fr' : 'французский',
    'be' : 'белорусский',
    'es' : 'испанский',
    'it' : 'итальянский',
    'bg' : 'болгарский',
    'cs' : 'чешский',
    'tr' : 'турецкий',
    'detect' : 'произвольный'
};

var langNameOm = {
    'ru' : 'русском',
    'en' : 'английском',
    'pl' : 'польском',
    'uk' : 'украинском',
    'de' : 'немецком',
    'fr' : 'французском',
    'be' : 'белорусском',
    'es' : 'испанском',
    'it' : 'итальянском',
    'bg' : 'болгарском',
    'cs' : 'чешском',
    'tr' : 'турецком',
    'detect' : 'любом'
};

var goodTranslations = {};

function updatePlaceholder() {
    $('#request_input').attr('placeholder', 'Введите слово на ' + langNameOm[$('#langs_from').val()] + ' языке, для перевода на ' + langName[$('#langs_to').val()]);
}

function langSelect() {
    var langsTo = $('#langs_to');
    langsTo.children().remove();

    var from = $(this).val();
    var tos = goodTranslations[from];
    var first = 1;
    for (var to in tos) {
        var o = $('<option/>', {value: tos[to]}).text(langName[tos[to]]);
        langsTo.append(o);
        if (from != tos[to] && first) {
            first = false;
            o.attr('selected', true);
        }
    }
    updatePlaceholder();
}

function flipLanguages() {
    var langsFrom = $('#langs_from');
    var langsTo = $('#langs_to');
    var from = langsFrom.val();
    var to = langsTo.val();

    langsFrom.val(to);
    langSelect.call(langsFrom);
    if ($.inArray(from, goodTranslations[to]) != -1) {
        langsTo.val(from);
    }
    updatePlaceholder();
}

function paste() {
    alert("Вставка пока не работает!");
}
function copy() {
    alert("Копирование пока не работает!");
}

function onMessageReceived(e) {
    console.log(e);
}

function init() {
    $.get('https://dictionary.yandex.net/api/v1/dicservice.json/getLangs?ui=ru&key='+ encodeURI(myLittleKey), function(response) {
        for (var i = 0; i < response.length; ++i) {
            var from = response[i].substring(0, 2);
            var to = response[i].substring(3, 5);
          
            if (!goodTranslations[from])
                goodTranslations[from] = [to];else
                goodTranslations[from] = goodTranslations[from].concat(to);
        }
        goodTranslations['detect'] = ['ru'];

        var langsFrom = $('#langs_from');
        langsFrom.children().remove();
        for (var from in goodTranslations) {
            if (from in langName) {
                langsFrom.append( $('<option/>', {value: from}).text(langName[from]) );
            }
        }
        langsFrom.val('detect');
        langsFrom.change(langSelect);
        langSelect.call(langsFrom);

        $('#langs_to').change(updatePlaceholder);
        $('#arrow_holder').click(flipLanguages);
        $('#request_paste').click(paste);

        if (location.search) {
            var pd = {};
            var params = location.search.substr(1).split('&');
            for (var i = 0; i < params.length; ++i) {
                var p = params[i].split('=');
                if (p.length != 2) continue
                pd[ p[0] ] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            if ('query' in pd && 'lang' in pd) {
                var from = pd['lang'].substr(0, 2);
                var to = pd['lang'].substr(3, 5);
                if (from in goodTranslations && $.inArray(to, goodTranslations[from]) != -1) {
                    $('#request_input').val(pd['query']);
                    langSelect.call($('#langs_from').val(from));
                    $('#langs_to').val(to);
                    $('#request_submit').click();
                }
            }
        }
    }).error(function() {
        var main = $('.main');
        main.children().remove();
        $('<div/>', {class : 'error'}).text('Ошибка соединения, попробуйте перезагрузить страницу').appendTo(main);                
    });

    $('#cat_of_day').append($('<img/>', {id: 'cat_of_day_image', src: catsOfDay[Math.floor(Math.random() * (catsOfDay.length))]}));

    var phraseID = Math.floor(Math.random() * (phrases.length));
    var phraseLangs = ["en", "de", "it", "es", "fr"];
	var lang = phraseLangs[Math.floor(Math.random() * (phraseLangs.length))];
    $('#phrase_of_day').append($('<a/>', {text: phrases[phraseID][lang], href: '/index.html?lang=' + lang + '-ru&query=' + encodeURI(phrases[phraseID][lang])}));
    $('#phrase_of_day').append($('<div/>', {class: 'explanation', text: '(' + phrases[phraseID]['ru'] + ')'}));
}



var catsOfDay = ['http://www.raskupim.ru/pics/2009-07-16-17-05-10-kotik2.jpg',
'http://www.chelyabinsk.name/foto/dosk_foto4_8821.jpg',
'http://desktopwallpapers.org.ua/download.php?img=201110/1600x1200/desktopwallpapers.org.ua-6796.jpg',
'http://img181.imageshack.us/img181/8489/24478841cs9.jpg',
'http://img.mota.ru/upload/wallpapers/2011/03/23/08/05/24746/mota_ru_1032318-1024x768.jpg',
'http://www.berikota.ru/Sites/berikota_ru/Uploads/User/3690ec72d873933d27b78bd35d5bc590.jpg',
'http://img444.imageshack.us/img444/6628/7502573769bg0.jpg',
'http://www.zoopets.ru/photo/full/8681-kitten.jpg',
'http://img0.liveinternet.ru/images/attach/c/4/80/318/80318044_large_290558762_19f4426a1d_o.jpg',
'http://zoo-dom.com.ua/upload/fotogallery/ru/20091228042047_foto.jpg',
'http://shadowness.com/file/item/2665/image_t6.jpg',
'http://doseng.org/uploads/posts/2011-07/1311786211_1008.jpg',
'http://img.mota.ru/upload/wallpapers/2009/07/15/11/02/3622/animals_676-1280x1024.jpg',
'http://www.moscow99.ru/uploads/iboard/1/1id7479650.jpg',
'http://s005.radikal.ru/i211/1204/0d/e923021e69c1.jpg',
'http://i5.minus.com/iG6QKfgmcKmfz.jpg',
'http://file.mobilmusic.ru/be/b4/27/969676.jpg',
'http://arctur-1.narod.ru/animals/Cats/images/127_5524.jpg',
'http://www.ljplus.ru/img4/k/l/kladovshik2011/Cuties_22.jpg',
'http://images.v-teme.com/media/images/posts/viewphoto/84376.jpg',
'http://lol54.ru/uploads/posts/2012-08/1345125264_lol54.ru_010.jpg',
'http://www.activeclub.com.ua/modules/gallery/d/7672-3/cats_d_ra_03_09+_41_.jpg',
'http://www.catfoto.com/uploads/images/00/00/72/2011/01/29/fd8b87.jpg',
'http://lol54.ru/uploads/posts/2010-08/1282146783_144.jpg',
'http://i005.radikal.ru/0712/58/250d5cb21042.jpg',
'http://www.prikol.ru/wp-content/gallery/march-2010/podborka-19032010-08.jpg',
'http://resimlerd.com/data/media/37/sirin-kediler.jpg',
'http://www.wallpage.ru/imgbig/wallpapers_19490.jpg',
'http://img.by/i/GQD.jpg',
'http://www.krasfun.ru/images/2010/10/fe99c_1286309687_doseng.org_1285881356_60.jpg',
'http://lol54.ru/uploads/posts/2010-08/thumbs/1282146802_134.jpg',
'http://img1.liveinternet.ru/images/attach/c/0/38/756/38756927_5.jpg',
'http://s1.uploads.ru/i/dHqwW.jpg',
'http://lol54.ru/uploads/posts/2011-08/thumbs/1312186055_1311322765_kotomatrix_12.jpg',
'http://pics2.pokazuha.ru/p442/0/9/ggf156990.jpg',
'http://img.by/i/aljK.jpg',
'http://www.thewallpapers.org/photo/55335/Cute-Cats-048.jpg',
'http://www.activeclub.com.ua/modules/gallery/d/7528-3/cats_5+_65_.jpg',
'http://www.activeclub.com.ua/modules/gallery/d/7568-3/cats_5+_75_.jpg',
'http://www.mega-tapety.info/resize/zwierzeta-koty-2560-1600-9693.jpg',
'http://sputnik-n.ru/exogens.ruen.db/photogallery/1242719086.jpg',
'http://www.svetreiki.ru/media/kunena/attachments/9867/cf0ad818f87.jpg_2.jpg',
'http://mybritishcat.ru/wp-content/uploads/2011/12/Sensoryi-koshki1.jpg',
'http://amolife.com/image/images/stories/Animals/Cats/sleeping_cuties%20(16).jpg',
'http://pazitiff.info/uploads/posts/2011-07/thumbs/1311941246_012.jpg',
'http://www.desktopas.com/files/2013/10/HD-Desktop-Wallpaper-Hd-White-Wallpapers-White-Wallpaper-31-1-1600x1200.jpg',
'http://2krota.ru/uploads/posts/2011-02/1298909262_1276718586_4.jpg',
'http://xproggn.net/images/data/7/4/real.7406a39ddb29f9ac86a54a9ed804d0cf.jpg',
'http://img0.liveinternet.ru/images/attach/c/4/80/318/80318058_large_kittens_w_13m_.jpg',
'http://img.mota.ru/upload/wallpapers/2011/09/16/09/05/27811/mota_ru_1091440-1024x768.jpg',
'http://www.bildites.lv/download.php?file=n7uu47zqel7b4tyj1cn.jpg',
'http://img.by/i/xwrJX.jpg',
'http://kolyan.net/uploads/posts/2011-04/1304101140_koti.jpg',
'http://www.activeclub.com.ua/modules/gallery/d/7536-3/cats_5+_67_.jpg',
'http://pazitiff.info/uploads/posts/2011-03/1299609457_204-1024.jpg',
'http://img0.liveinternet.ru/images/attach/c/2/73/405/73405726_eburg_b_9872.jpg',
'http://kotomatrix.ru/images/lolz/2011/04/21/890047.jpg',
'http://lol54.ru/uploads/posts/2010-08/1282146802_134.jpg',
'http://nibler.ru/uploads/users/8039/2013-04-08/niblera-kotyata-kartinki-koshki-sobaki-smeshnye-zhivotnye-kote_447899746.jpg',
'http://img0.liveinternet.ru/images/attach/c/2/74/385/74385616_image.jpg',
'http://www.zoopets.ru/photo/full/3238-kitten.jpg',
'http://qrok.net/uploads/posts/2010-08/thumbs/1281459075_cats_6-96.jpg',
'http://www.krasfun.ru/images/2010/10/ec427_1286309654_doseng.org_1285881379_52.jpg',
'http://www.monstras.lt/wallpaper/1-0/4230_13331_rozovyj_kotenok_1600x1200_www_monstras_lt.jpg',
'http://img0.liveinternet.ru/images/attach/c/2/74/385/74385616_large_image.jpg',
'http://cs319030.userapi.com/v319030764/150b/0QYtmQcrNKc.jpg',
'http://ya-zhenschina.ucoz.ru/_fr/1/3689969.jpg',
'http://www.wallpage.ru/imgbig/wallpapers_37470.jpg',
'http://img0.liveinternet.ru/images/attach/c/4/80/318/80318058_kittens_w_13m_.jpg',
'http://img.mota.ru/upload/wallpapers/2011/09/16/09/05/27811/mota_ru_1091440-1600x1200.jpg',
'http://mybritishcat.ru/wp-content/uploads/2011/12/Sensoryi-koshki1-1024x640.jpg',
'http://img-2006-11.photosight.ru/14/1763922.jpg',
'http://funnycatwallpapers.com/wp-content/uploads/2012/08/funny-persian-cats-11.jpg',
'http://data.photo.sibnet.ru/upload/imggreat/124867281009.jpg',
'http://img1.liveinternet.ru/images/attach/c/3/76/658/76658371_KOTYONOK_S_KLUBKAMI.jpg',
'http://s4.live4fun.ru/pictures/s3img_18457562_10073_0.jpg',
'http://bmwvrn.ru/content/images/news/466.jpg',
'http://www.foxyhome.ru/uploads/posts/2008-07/1217286896_5.jpg',
'http://www.ipb.su/uploads/ipbsu/podarizhizn/post-11-1330501834.jpg',
'http://yahooeu.ru/uploads/posts/2009-07/1246447584_0_7036_c993d133_xl.jpg',
'http://barnaul.freeadsin.ru/content/root/users/2012/20120404/visitor/images/201204/f20120404073844-chernyj-kotenok.jpg',
'http://amur.3dn.ru/_ph/5/493608809.jpg',
'http://images.slanet.ru/~src6484672_2/Chistokrovnye_britanskie_kotyata_s_dokumentami.jpg',
'http://file.mobilmusic.ru/ae/fe/9b/962852.jpg',
'http://rnns.ru/uploads/posts/2009-09/1252693831_siamese.jpg',
'http://www.edu54.ru/sites/default/files/images/2011/03/4c6c290051dfca6766154dfdd4ebf5d0c4994b32.jpg',
'http://www.bilderpilot.de/bilder/animal/1024x768/animal_622.jpg',
'http://www.wallon.ru/_ph/14/462243421.jpg',
'http://www.hullumaja.com/files/pictures/2011/06/29/wrrmfFB6rk.jpg',
'http://www.1ufa.ru/pic/220509f/funny_3930.jpg',
'http://www.walls-world.ru/wide-wallpapers/animal/wallpapers_864_1280x800.jpg',
'http://www.greenmama.ua/dn_images/01/28/71/87/122450204933842853_1224230903_30935334_1219256342_kitty__kitty___by_hoschie.jpg',
'http://kotomatrix.ru/images/lolz/2012/02/18/1114973.jpg',
'http://ic.pics.livejournal.com/tdn2007/15054764/314963/314963_original.jpg',
'http://dreamworlds.ru/uploads/posts/2010-09/1283971370_49.jpg',
'http://pix.fantasypictures.ru/pix/kitty/5.jpg',
'http://www.vsezverushki.ru/img/full/512.jpg',
'http://i076.radikal.ru/0905/ba/5a0186692423.jpg',
'http://kotoff.org/images/phocagallery/hq/70_cliparts/049.jpg',
'http://picsdigest.com/wallpapers/24_5562_oboi_tri_milyh_kotenka_1400x1050.jpg',
'http://doseng.org/uploads/posts/2011-07/1311786169_1014.jpg',
'http://kolyan.net/uploads/posts/2013-04/1365495177_niblera-kotyata-kartinki-koshki-sobaki-smeshnye.jpg',
'http://vetdoctor.ru/image/klub/9383.jpg',
'http://legend.az/uploads/posts/2012-01/1327653995_18.jpg',
'http://4sims.ru/uploads/gallery/main/6/1225947_ii.jpg',
'http://www.yes.md/Remarks/d928062e-0630-4752-ad6d-d3624942c2c0.jpg',
'http://www.respectme.ru/uploads/photoblog/thumbs/640x/a/a5450b891faec4f3c2a64a57bf2561de.jpg',
'http://img0.liveinternet.ru/images/attach/c/1/74/832/74832132_22222.jpg',
'http://yawall.ru/images/Jivotnie-oboi-foto-izobrajeniya-jivotnih/1600x1200/52106-Malenkiy-kotenok-potyagivaetsya-sprosonya-1600x1200.jpg',
'http://2.bp.blogspot.com/_KvDFauTmm3g/TIOt72XZqFI/AAAAAAAAC7Y/cwm_89-ETM4/s1600/cute-kitten-501.jpg',
'http://www.hullumaja.com/files/pictures/2011/05/08/kkEYU0uLgt.jpg',
'http://www.thewallpapers.org/photo/55252/Cute-Cats-008.jpg',
'http://1600x1200.net/oboi/zhivotnie/175532779.jpg',
'http://www11.0zz0.com/2011/08/09/13/695902028.jpg',
'http://pazitiff.info/uploads/posts/2011-07/thumbs/1311941303_0080.jpg',
'http://drug2.ru/uploads/230438.jpg',
'http://www.wallcoo.net/animal/baby_pussy_kittens/images/Wallcoo_com_baby_pussy_kitten_baby_Cat_437.jpg',
'http://www.zoopets.ru/photo/full/5166-kitten.jpg',
'http://makar.homelinux.net/ftp/pub/!flash/media/pictures/wallpapers/20080402/r4q1uk5s04otdemayme6zknamr1ys8ff_5.jpg',
'http://lol54.ru/uploads/posts/2011-07/1310624672_118.jpg',
'http://www.ipb.su/uploads/ipbsu/podarizhizn/post-11-1340619267.jpg',
'http://zverki.org/wp-content/uploads/2010/12/wallpapers_cats_203.jpg',
'http://gorod.tomsk.ru/i/u/9119/online_ua-tisw32l7w7.jpg',
'http://s48.radikal.ru/i122/1005/c3/505343a4b6f4.jpg',
'http://pazitiff.info/uploads/posts/2011-07/thumbs/1311941281_026.jpg',
'http://img.pauzicka.zoznam.sk/pictures/maciatko.jpg',
'http://wallpaperstock.net/little-kitten_wallpapers_7566_1920x1200.jpg',
'http://www.krasfun.ru/images/2010/10/17e31_1286309634_doseng.org_1285881457_86.jpg',
'http://www.greenmama.ru/forum_img/01/67/82/61.0.i_tak_lyubim!.jpg',
'http://s008.radikal.ru/i306/1011/dc/0d9db4c8cc3f.jpg',
'http://citata-love.3dn.ru/_ph/26/255225099.jpg',
'http://img0.liveinternet.ru/images/attach/c/9/105/225/105225882_large_original.jpg',
'http://www.rgbpicture.com/img/cool/cutestkittens/cutestkittens34.jpg',
'http://cs10712.vkontakte.ru/u12389687/-14/y_a1955e72.jpg',
'http://www.motto.net.ua/old_site/img/animals1/1194206711_CAEEF2FFF2E020E220F6E2E5F2EEF7EDEEEC20E3EEF0F8EAE5203031.jpg',
'http://www.podkat.ru/uploads/posts/2010-02/thumbs/1265832349_image_0082.jpg',
'http://www.korzik.net/uploads/posts/1160157706_1160137148_mixmux164_20.jpg',
'http://bspk-rena.narod.ru/images/Funny_kitten.jpg',
'http://i040.radikal.ru/0712/ac/c8bfecb13b2f.jpg',
'http://www.activeclub.com.ua/modules/gallery/d/5806-3/cats_6+_96_.jpg',
'http://forum.speedway.ru/uploads/profile/photo-10141.jpg',
'http://proxy10.media.online.ua/oboi/r2-d2/004/221/046/orig4bbbfac7a8246.jpg',
'http://file.mobilmusic.ru/bd/8d/7a/600721.jpg',
'http://kotomatrix.ru/images/lolz/2008/10/27/T.jpg',
'http://www.zveryshki.ru/uploads/posts/2008-09/1222288755_1.jpg',
'http://img.by/i/8Owzp.jpg',
'http://kolyan.net/uploads/posts/2011-07/1311497671_13.jpg',
'http://www.gorgetta.ru/kitten/litter_1/start/kitten_0_mont_12_days_1.jpg',
'http://file.mobilmusic.ru/67/8c/09/463154.jpg',
'http://pazitiff.info/uploads/posts/2010-08/1283114433_017.jpg',
'http://www.img-box.ru/repository/animal/www.img-box.ru_1365.jpg',
'http://www.imagensgratis.com.br/imagens/animais-gato-539fc9.jpg',
'http://images.petovod.ru/photos/130339176314.jpg',
'http://i02so.timsah.com/galleries/1963/23232/1_400.jpg',
'http://statics.trikky.ru/trikkyru/wp-content/blogs.dir/1/files/2011/06/950451.jpg',
'http://ib1.keep4u.ru/b/070922/ebe9c6073b3ff3e404.jpg'];


var phrases = [
	{
		"ru" : "﻿Аппетит приходит во время еды",
		"en" : "One leg of mutton helps down another",
		"de" : "Der Appetit kommt beim Essen",
		"fr" : "L'appétit vient en mangeant",
		"it" : "L'appetito viene mangiando",
		"es" : "El apetito viene comiendo"
	},
	{
		"ru" : "Беда не ходит одна",
		"en" : "It never rains, but it pours",
		"de" : "Ein Unglück kommt selten allein",
		"fr" : "Un malheur ne vient jamais seul",
		"it" : "Piove sul bagnato",
		"es" : "Un mal nunca viene solo"
	},
	{
		"ru" : "Бедность не порок",
		"en" : "Poverty is no crime",
		"de" : "Besser karg als ar",
		"fr" : "Pauvreté n'est pas vice, mais c'est bien pis",
		"it" : "Poverta non guasta gentilezza",
		"es" : "Ser pobre no es un delito"
	},
	{
		"ru" : "Вода камень точит",
		"en" : "Little strokes fell great oaks",
		"de" : "Geduld bringt Huld",
		"fr" : "Petit à petit l'oiseau fait son nid",
		"it" : "Col tempo e con la paglia maturano le nespole",
		"es" : "A la tercera va la vencida"
	}
];

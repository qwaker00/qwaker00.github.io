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

    $('#cat_of_day').append($('<img/>', {id: 'cat_of_day_image', src: catsOfDay[Math.floor(Math.random() * (catsOfDay.length))]}).error(function(){
    	$(this).attr('src', catsOfDay[Math.floor(Math.random() * (catsOfDay.length))]);
    }));

    var phraseID = Math.floor(Math.random() * (phrases.length));
    var phraseLangs = ["en", "de", "it", "es", "fr"];
	var lang = phraseLangs[Math.floor(Math.random() * (phraseLangs.length))];
    $('#phrase_of_day').append($('<a/>', {text: phrases[phraseID][lang], href: '/index.html?lang=' + lang + '-ru&query=' + encodeURI(phrases[phraseID][lang])}));
    $('#phrase_of_day').append($('<div/>', {class: 'explanation', text: '(' + phrases[phraseID]['ru'] + ')'}));
}

var catsOfDay = ['http://img.izifunny.com/pics/20120409/640/kittens-100-pics_67.jpg',
'http://www.greenmama.ru/dn_images/01/67/71/15/1245319195izmenenie_razmera_v_rozovom.jpg',
'http://de.trinixy.ru/pics4/20110608/cats_cats_46.jpg',
'http://s39.radikal.ru/i085/1004/0e/ae69e9b72fb9t.jpg',
'http://www.kokoko.ru/uploads/posts/2012-04/1333960080_kittens_44.jpg',
'http://ic.pics.livejournal.com/laserpress/16779874/86636/86636_original.jpg',
'http://h3.img.mediacache.rugion.ru/_i/forum/thumbs/95/12/90/951290_188356_1286098376.jpg',
'http://bylix.com/uploads/posts/2009-11/thumbs/1258172308_1258085418_cats_best_lx_072.jpg',
'http://s004.radikal.ru/i207/1102/2b/235725f725b5.jpg',
'http://oboi.kards.qip.ru/images/wallpaper/f5/05/67061_1024_768.jpg',
'http://mypoto.do.am/_ph/29/1/93695907.jpg',
'http://images.webpark.ru/uploads53/090702/Kitten_23.jpg',
'http://ascuteaspossible.com/wp-content/uploads/2013/09/67767.jpg',
'http://i.i.ua/cards/thumb/9/0/37509.jpg',
'http://wallons.ru/fon/17/kotenok_polosatyy_morda_grustnyy_prev.jpg',
'http://pappagallogiallo.com/wp-content/uploads/2012/07/0403.jpg',
'http://explosionhub.com/wp-content/uploads/2012/07/Cat-sleep-wallpapers.jpg',
'http://desktopwallpapers.org.ua/download.php?img=201110/320x240/desktopwallpapers.org.ua-6796.jpg',
'http://i.hdwp.ru/f/7d64/7/6077158de6.jpg',
'http://www.agitka.net/images/201009/22/2bmoukm6zoj2.jpg',
'http://magspace.ru/uploads/2010/11/19/12927/magspace.ru_14681837.jpg',
'http://jili-bili.ru/users/avatars/4832.jpg',
'http://www.motto.net.ua/mini/201209/26403.jpg',
'http://scouteu.s3.amazonaws.com/cards/images_vt/thumbs/ciesz_sie_zyciem_0.jpg',
'http://2.bp.blogspot.com/-p1j4xnoiIJw/TWW-po1u2GI/AAAAAAAAAHk/CCsCGjA3Jig/s1600/kucing3.jpg',
'http://www.superedo.it/sfondi/sfondi/Animali/Gatti/gatti_26.jpg',
'http://img.izifunny.com/pics/20120409/640/kittens-100-pics_28.jpg',
'http://toget.ru/news_pics/543/543428_Sladkiy_kotenok_(16_foto).jpg',
'http://i04.fotocdn.net/2/tlog_box/1391/1391733.jpg',
'http://lib2.podelise.ru/tw_files2/urls_745/2/d-1356/img75.jpg',
'http://mobilepics.ru/uploads/pictures/animals/animals-6082.jpg',
'http://s020.radikal.ru/i720/1304/6a/03e5fd4d0274.jpg',
'http://pazitiff.info/uploads/posts/2011-07/thumbs/1311941247_016.jpg',
'http://400x240.3dn.ru/_ph/6/2/579065903.jpg',
'http://malishka2084.www.nn.ru/users/foto/309053-2011-12-13-wall_images_large.jpg',
'http://i2.minus.com/iGSfxDpkE3hxY.jpg',
'http://forum.forum.forum.rum.byaki.net/uploads/posts/2012-11/1352320432_cats_cm_20120225_00391_030.jpg',
'http://kotod.ru/sites/default/files/styles/i1024x768/public/images/0000564.jpg',
'http://piximus.net/media/17181/animal-planet-252-29.jpg',
'http://podrobnosti.ua/upload/news/2010/04/14/679195_3.jpg',
'http://album.foto.ru/photos/th/141148/21097.jpg',
'http://britanka.com.ua/images/gm/30_o.jpg',
'http://ecards.cau.lv/files/galery/small/567.jpg',
'http://inima.ru/wp-content/uploads/2013/01/Small_Kitty_iPod.jpg',
'http://th545.photobucket.com/albums/c245/karajoe/th_cat.jpg',
'http://1.bp.blogspot.com/_jJdd6ocY1jQ/TJp6ipom_7I/AAAAAAAAAB8/e4eqEr278MI/s400/042_pics%5B2%5D.jpg',
'http://piximus.net/media/4584/thumb.jpg',
'http://poxe.ru/uploads/posts/2010-03/1267711439_1194206711_caeef2fff2e020e220f6e2e5f2eef7edeeec20e.jpg',
'http://podruzhki.ru/data/wall/37185/3ba8795f6d7065ed9b7f4f056ff906c2.jpg',
'http://nevsepic.com.ua/uploads/posts/2011-10/1318104708_11_www.nevsepic.com.ua.jpg',
'http://cs9767.userapi.com/u133348566/a_56bb9a15.jpg',
'http://privet.mobi/files/fpics/1/7734/mobile.jpg',
'http://www.allfons.ru/images/201112/allfons.ru_2457.jpg',
'http://files.seclub.org/pic/4/d/0/4d0408196609ca47dafb76658ff1160f.jpg',
'http://obouklascomua.samomu.ru/data/storage/attachments/3c3ddf09b91d8dc4b7f643fea9ea052e.jpg',
'http://www.blogol.hu/pikz/cicumicu/126065.jpg',
'http://kisakuku.ru/news/images-up/12210/12210_35_78bfaf699129d4425655cc066581f782.jpg',
'http://img2.vetton.ru/upl/1000/2/vetton_ru_cats559-1920x1200.jpg',
'http://www.featurepics.com/FI/Thumb/20071217/Kitten-Resting-547811.jpg',
'http://file.mobilmusic.ru/2c/c4/d0/559578-160.jpg',
'http://open.az/uploads/posts/2012-06/1340642271_kotjataaaaaaaaaaaaaaaaaaaaaa.jpg',
'http://i26.fastpic.ru/big/2011/0829/b6/810feec037807d05bc7167adeb58f0b6.jpg',
'http://staticspui.sindom.ru/upload/s/p/u/i/1_kotenok-milashka.jpg',
'http://i1.desktopmania.ru/pics/00/29/68/DesktopMania.ru-29680-300x219.jpg',
'http://www.theplace.ru/archive/pic_animals/img/2142_s.jpg',
'http://lacocinadebender.com/wp-content/uploads/2012/04/gatos-gatitos-crias-40-533x800.jpg',
'http://joke4you.net/uploads/site1/big_897833_1229340.jpg',
'http://pappagallogiallo.com/wp-content/uploads/2012/07/0472.jpg',
'http://pixdaus.com/files/items/pics/0/8/292008_c85295a89de1386c9c7dba65b5171abe_mdsq.jpg',
'http://cs12814.vk.me/u29459237/video/m_8b52d3e0.jpg',
'http://magspace.ru/uploads/2011/06/10/10-51cats_cats_58.jpg',
'http://pic03.fototreff24.net/min/46384.jpg',
'http://download-multimedia.com/images/wallpaper/medium/5/kotyata_v_cvetochnom_gorshke_1600x1200_21_download-multimedia.com.jpg',
'http://www.gsmpedia.ro/images/wallpaper/display/10_1230058864.jpg',
'http://i45.twitgoo.com/2dryszc_th.jpg',
'http://img3.dreamies.de/img/171/t/5cpojerx1qb.jpg',
'http://file.mobilmusic.ru/78/1a/b3/605678-320.jpg',
'http://copypast.ru/uploads/posts/1316588185_1_10.jpg',
'http://www.allpolus.com/uploads/posts/2011-02-05/86195-12.jpg',
'http://desktopwallpapers.org.ua/pic/201110/800x600/desktopwallpapers.org.ua-6374.jpg',
'http://s3.wallpapic.de/4d4699f133bb1ebfaa67681f57e66d26/31/31852/thumb.jpg',
'http://sasisa.ru/uploads/posts/thumbs/1245183549_03.jpg',
'http://www.free-hdwallpapers.com/wallpapers/animals/7267.jpg',
'http://media.kuechengoetter.de/media/509/13098719846720/kitty__kitty___by_hoschie.jpg',
'http://cs306412.userapi.com/v306412920/2fa9/BuktNBFMdzo.jpg',
'http://file.mobilmusic.ru/a5/55/68/817231-320.jpg',
'http://mediasubs.ru/group/uploads/kl/klub-dlya-lyudej-u-kotoryih-doma-zhivut-koshki/image2/EtNjY4ZS0.jpg',
'http://i999.photobucket.com/albums/af120/kristen_teehee/japanese/bth_cute-japanese-kitten.jpg',
'http://mp3-melodi.ru/theme/kartinka_na_telefon_zhivotnie-_koshki-_543546f1543f6f.jpg',
'http://drug2.ru/uploads/136850.jpg',
'http://static.hdw.eweb4.com/media/thumbs/1/75/749606.jpg',
'http://img2.1001golos.ru/ratings/794000/793501/pic1.jpg',
'http://photos.capturecincinnati.com/photos/qVC4KBa-Bw0R6faZMDSXdg/showcase.jpg',
'http://wallportal.de/wallpapers/e02a409a55c673d7abb0979ea9ae12e5/1111_4.jpg',
'http://wpapers.ru/wallpapers/animals/Cats/11549/download/1600x1280_%D0%97%D0%B5%D0%B2%D0%B0%D1%8E%D1%89%D0%B8%D0%B9-%D0%BA%D0%BE%D1%82%D0%B5%D0%BD%D0%BE%D0%BA.jpg',
'http://www.hullumaja.com/files/pictures/2011/04/28/thumbs/zJeJjfDS9f.jpg',
'http://img.desktopwallpapers.ru/animals/pics/871-160.jpg',
'http://img.mota.ru/upload/wallpapers/2011/01/18/20/02/23881/mota_ru_1011814-1600x1200.jpg',
'http://f1.live4fun.ru/small_pictures/img_20339136_106_13.jpg',
'http://s52.radikal.ru/i136/1210/20/640598ef4581.jpg',
'http://kisakuku.ru/news/images-up/12230/12230_24_223128f6dc123dadc90f640f2964fe45.jpg',
'http://i.ucrazy.ru/files/i/2012.10.22/1350922643_222222222222222-76.jpg',
'http://www.thewallpapers.org/photo/55202/Cute-Cats-061.jpg',
'http://img.by/i/bZGzj.jpg',
'http://www.vancats.ru/images/Ricardo_Oliveira_5min.jpg',
'http://sextalk.com.ru/files/new/pic/1/20778626584c46c4.jpg',
'http://lady.webnice.ru/img/2010/07/img20100715085002_2208.jpg',
'http://www.superwallpapers.ru/mpreview/14620.jpg',
'http://cs9942.userapi.com/u100458181/-14/q_98d20e0d.jpg',
'http://www.zastavki.com/pictures/286x180/2012/Animals_Cats_Kitten_and_Tree_032872_32.jpg',
'http://buyukkeyif.com/uploads/2013/05/user_32158_4ac21381de58a121854fc625219232c6.jpg',
'http://www.tusoffka.net/uploads/posts/2009-07/thumbs/1246413615_1246408103_004_pics.jpg',
'http://picsdigest.com/wallpapers/24_5562_oboi_tri_milyh_kotenka_1400x1050.jpg',
'http://file.mobilmusic.ru/68/cb/d5/585383.jpg',
'http://board.zoovet.ru/sites/default/files/imgsrc/40458.jpg',
'http://farm5.static.flickr.com/4127/5000764851_9f47b9eff1_b.jpg',
'http://vse.kz/uploads/monthly_04_2013/post-367255-0-36971400-1366187166.jpg',
'http://podruzhki.ru/data/wall/64537/66745_bialy_kotek_lapki.jpg',
'http://file.mobilmusic.ru/e7/48/cf/427874-320.jpg',
'http://iranpet.net/imageup/images/121729zpz.jpg',
'http://l2.yimg.com/bt/api/res/1.2/eKGtyYUD4K.dmuyTXrvIpA--/YXBwaWQ9eW5ld3M7cT04NTt3PTMxMA--/http://media.zenfs.com/en-GB/blogs/ept_prod/rankings_uk-317469291-1309795957.jpg',
'http://s007.radikal.ru/i302/1101/fc/070f3bbe9cab.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141179_kittens_50.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141151_kittens_07.jpg',
'http://3.bp.blogspot.com/-rf59RKzNfzg/TpzuWSXWMuI/AAAAAAAACRg/KNPj-0Ixhfo/s320/Happy.jpg',
'http://pappagallogiallo.com/wp-content/uploads/2012/07/0452.jpg',
'http://cs5592.userapi.com/u64070326/-6/s_ae7bdf52.jpg',
'http://cs403626.userapi.com/v403626858/5830/FKT5otcw3GY.jpg',
'http://cs307314.userapi.com/v307314730/2723/ZEza__dPF9M.jpg',
'http://th09deviantart.creatingfreesites.com/fs49/300W/i/2013/099/f/8/cute_overload_by_chrissiecool-d23nb9t.jpg',
'http://my-desktop.ru/thumbs/cats_224-t1.jpg',
'http://cs309922.userapi.com/v309922180/1994/vGkquP9-QTA.jpg',
'http://gl00.weburg.net/00/news/5/21490/bigposter/424049.jpg',
'http://www.motto.net.ua/images/201209/motto.net.ua_9351.jpg',
'http://img.aledemoty.pl/v2/a6/09/a609939f-b8a4-48a0-8553-1bca418bbd4f.jpg',
'http://funzoo.ru/uploads/posts/2011-04/thumbs/1303930703_presents_cat015.jpg',
'http://cats.firefun.ru/images/gallery/thumbs_cache/08/08880-1246514040_hiop_ru_cats_11-cats.firefun.ru.jpg',
'http://crunchpost.com/wp-content/uploads/2011/08/baby-animal-photography-24.jpg',
'http://www.kokoko.ru/uploads/posts/2012-04/1333960067_kittens_63.jpg',
'http://www.look.com.ua/download.php?file=201209/1280x1024/look.com.ua-28031.jpg',
'http://cs888.vk.me/u94535624/a_48d0c757.jpg',
'http://media.noob.us/thumbs/cutekittenafraid.jpg',
'http://www.gameinformer.com/cfs-filesystemfile.ashx/__key/CommunityServer-Components-ImageFileViewer/CommunityServer-Components-UserFiles-00-01-45-11-84-Attached+Files/7853.thumbs_5F00_najslodze_2D00_kociaki_2D00_009.jpg_2D00_610x0.jpg',
'http://img.mota.ru/upload/wallpapers/2011/09/16/09/05/27811/mota_ru_1091440-preview-thumb.jpg',
'http://nevseoboi.com.ua/uploads/posts/2010-11/1291139108_cd200055.jpg',
'http://cs5698.userapi.com/u158038223/-6/x_1bb756d1.jpg',
'http://www.winxfan.su/sites/winxfan.su/files/imagecache/thumbnail/23597_1024_768.jpg',
'http://cs421629.userapi.com/v421629416/212d/h3yOkVbWAWU.jpg',
'http://pappagallogiallo.com/wp-content/uploads/2012/07/0317.jpg',
'http://www.pantherkut.com/wp-content/uploads/2008/12/cutest-kitten-2-150x150.jpg',
'http://cdn.trinixy.ru/pics3/20080424/kittens_15.jpg',
'http://forum.speedway.ru/uploads/profile/photo-10141.jpg',
'http://uh.ru/files/a/81/8579/images/i0axntzyh2y.jpg',
'http://www.1280x800.net/mini/201202/1832.jpg',
'http://s.picsfab.com/static/contents/images/8/5/e/95c78396709b992bdc712dd68092d.jpg',
'http://planetapozitiva.ru/uploads_guestbook/thumbs/125383.jpg',
'http://www.uslanmam.com/uyeler/mc-echolon-353925/album/sevimli-kediler-1186/30d6dbeb94e54ed082a674c128a7af8404-28863t.jpg',
'http://pixdaus.com/files/items/pics/6/22/16622_585d44fca636d5dc0d25b7c76f87992a_thsq.jpg',
'http://cdn.photoholding.com/RBalancerWeb/SquidPreviewGroupBalancer/ddfb5dce01ab4637b3578c7ea17f43af/100/100/0/98/600/856/98/11_data4_fPnOilu2Q9o=_ddfb5dce01ab4637b3578c7ea17f43af.jpg/s22/10463319ebe57bb89ccc7b17885b33c6.jpg',
'http://knoji.com/images/user/2225281_blog.jpg',
'http://cs406721.userapi.com/v406721497/4cce/mZ7yPLlBqlA.jpg',
'http://ib1.keep4u.ru/b/070922/ebe9c6073b3ff3e404.jpg',
'http://www.edu54.ru/sites/default/files/resize/userfiles/image/007(9)-400x300.jpg',
'http://oxun.ge/uploads/posts/2011-03/thumbs/1299672109_169.jpg',
'http://cs5932.vk.me/u69126753/147956821/x_424131b3.jpg',
'http://i1069.photobucket.com/albums/u477/Kat_Kueenz/th_5ec4181d.jpg',
'http://www.zastavki.com/pictures/640x480/2012/Animals_Cats_Cute_kitten_024945_29.jpg',
'http://www.ramlife.ru/img/0007/12776-a0daee4c_800.jpg',
'http://static.video.yandex.ru/get/vovchik1960/bjtnp3lzmo.712/5.320x240.jpg',
'http://pappagallogiallo.com/wp-content/uploads/2012/07/0661.jpg',
'http://puzzing.ru/public/puzzles/preview/39/36/39360114042011.jpg',
'http://pif.dn.ua/_fr/21/4538520.jpg',
'http://www.zastavki.com/pictures/640x480/2012/Animals_Cats_Kitten_and_Tree_032872_29.jpg',
'http://statics.photodom.com/photos/2010/01/31/thumb_1725817.jpg',
'http://www.teamstrange.net/wallpapers/4ffc09d2799d104c28afeb4e7edf1d3c/2331_1.jpg',
'http://file.mobilmusic.ru/b3/4f/cf/986245.jpg',
'http://bylix.com/uploads/posts/2011-10/thumbs/1317500149_1317491747_desktop-wallpapers-94-9.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141145_kittens_27.jpg',
'http://girls-together.ucoz.ru/_fr/3/2090080.jpg',
'http://welcometosandyland.files.wordpress.com/2013/10/white-kitten.jpg',
'http://files.magicnet.ee/magic_news/magicnet.ee_dir5/84567027212121212121312134548787.jpg',
'http://content.foto.mail.ru/mail/anatol4545/_myphoto/p-6412.jpg',
'http://www.mama.mk.ua/files/upload/132000/132429/148x148/1258041476_29.jpg',
'http://www.foxyhome.ru/uploads/posts/2008-04/thumbs/1209233860_15.jpg',
'http://doseng.org/uploads/posts/2008-05/1210101714_1209470813_5.jpg',
'http://www.kartinki.me/pic/201208/1280x960/kartinki.me-5846.jpg',
'http://img3.proshkolu.ru/content/media/pic/std/3000000/2232000/2231580-b358ae67fd1fd912.jpg',
'http://girldasha.ucoz.ru/_ph/1/505062335.jpg',
'http://www.mobiles24.com/static/previews/downloads/default/155/P-409874-erh8tietJO-1.jpg',
'http://www.thaicat.ru/_ph/12/1/371307264.jpg',
'http://pic.fotico.ru/22/433/5043322.jpg',
'http://file.mobilmusic.ru/fb/c8/0b/627350-176.jpg',
'http://zovreiki.ucoz.ru/_fr/7/s8111530.jpg',
'http://www.varbak.com/franceimages/japonais-photos-de-chats-miniatures-nk20459.jpg',
'http://copypast.ru/uploads/posts/1223638224_cat_wallpaper_09.jpg',
'http://cats.firefun.ru/images/gallery/thumbs_cache/07/07833-0_3311e_21c77989_XL-cats.firefun.ru.jpg',
'http://jot-it.ru/getfile/pid:public_50173/tp:image/505343a4b6f4.jpg',
'http://www.megafun.name/images/articles/pozitivnue-malenkie-kotjata_19.jpg',
'http://www.hullumaja.com/files/pictures/2011/04/28/zJeJjfDS9f.jpg',
'http://picsdesktop.net/Pets/1920x1440/PicsDesktop.net_78.jpg',
'http://rustem.in/images/new/p43/these_funny_animals_640_33.jpg',
'http://smeshnye-koshki.ucoz.ru/_bl/0/s68277798.jpg',
'http://ukr-cat.narod.ru/Kitten/ic/21.jpg',
'http://freesurf.com.ua/images/stories/Other/60.jpg',
'http://pic1.bbzhi.com/dongwubizhi/maorongkeaimaobaobaoxiezhen/animal_baby_pussy_kittens_493494_11.jpg',
'http://www.kagakribet.com/cute/icon-cute99.jpg',
'http://www.kp.ru/f/12/image/84/03/2480384.jpg',
'http://1nsk.ru/data/foto/127/600/2113795730.jpg',
'http://99px.ru/sstorage/56/2011/09/11209110304443334_tmb.jpg',
'http://pics2.pokazuha.ru/p442/0/9/ggf156990.jpg',
'http://im15.gulfup.com/q4yJ5.jpg',
'http://open.az/uploads/posts/2008-06/1212747294_cat_wallpaper_09.jpg',
'http://www.pitometc.ru/uploads/posts/2010-02/thumbs/1266882825_koshki6342.jpg',
'http://i044.radikal.ru/0906/a3/c0a52a65762e.jpg',
'http://cs402122.userapi.com/v402122151/3d74/pQHLrLv_o5E.jpg',
'http://board.lutsk.ua/uploads/monthly_12_2012/post-16375-0-27920600-1355401277_thumb.jpg',
'http://thefiles.ru/uploads/wallpapers/thumbs/1698.jpg',
'http://oktlife.ru/upload/iblock/d4c/d4c252db68df16913fc6eb79f8ae7c4e.jpg',
'http://static.video.yandex.ru/get/betlehem/7yodrjhxkc.400/1.320x240.jpg',
'http://cat55592.narod.ru/olderfiles/1/39.jpg',
'http://hq-wallpapers.ru/wallpapers/6/hq-wallpapers_ru_animals_27448_1920x1200.jpg',
'http://i99.beon.ru/kaifolog.ru/uploads/posts/2011-06/thumbs/1307527587_044.jpg',
'http://piximus.net/media/2198/daily-mix-99-94.jpg',
'http://board.zoovet.ru/sites/default/files/imagecache/img_300x200/imgsrc/22645.jpg',
'http://shuburshun.ru/wp-content/uploads/2010/03/1237296222_picture-85.jpg',
'http://www.zootorg.com/images/normal/156211.jpg',
'http://s56.radikal.ru/i154/1110/8b/018f30dd1bd3t.jpg',
'http://cs406624.vk.me/v406624783/58ed/Fnwb0lcDqIc.jpg',
'http://static.lolkot.ru/images/users/pets/34364.jpg',
'http://ig.att.oho.lv/2735/19853_m.jpg',
'http://pets.aknet.kg/uploads/gallery/main/7/5c3f386f347a5b9fddb56fed0da4e7.jpg',
'http://i.obozrevatel.ua/8/830427/gallery/79737_image_large.jpg',
'http://www.lolpix.com/_pics/Funny_Pictures_205/Funny_Pictures_2057_s.jpg',
'http://img.izifunny.com/pics/20120409/640/kittens-100-pics_31.jpg',
'http://www.dogandcat74.ru/files/images/000-12-1024x768_0.jpg',
'http://www.downloadcheapapp.com/appimg/52032/bilingual-voice-cards-screenshot-3.jpg',
'http://file.mobilmusic.ru/a9/b3/b8/849568-160.jpg',
'http://also.at.ua/_ph/4/2/70218262.jpg',
'http://desktopwallpapers.org.ua/download.php?img=201207/1400x1050/desktopwallpapers.org.ua-18124.jpg',
'http://cs5507.userapi.com/u7053589/-14/p_df99d3d4.jpg',
'http://s.properm.ru/profile_image/8607-1315041017.jpg',
'http://cs305906.userapi.com/u167402578/a_ba51cb42.jpg',
'http://mail-cat.ucoz.ru/_ph/4/1/700543911.jpg',
'http://img-6.photosight.ru/171/3209082_thumb.jpg',
'http://planeta.moy.su/_bl/199/s20677817.jpg',
'http://webweek.ru/uploads/posts/2010-10/thumbs/1286263165_these_funny_animals_505_640_07.jpg',
'http://us.cdn3.123rf.com/168nwm/patrickrp/patrickrp0712/patrickrp071200095/2225281-a-kitten-resting.jpg',
'http://server2.bezfishki.net/2011/062011/08/I/Dop/04/Podborka_kotyat_38.jpg',
'http://th229.photobucket.com/albums/ee273/kana_ermuun/th_gee_ru_77427.jpg',
'http://yaicom.ru/f/2011/09/sladkij-kotenok_33049_s__1.jpg',
'http://adorabooru.com/index.php?q=/thumb/283.jpg',
'http://img0.liveinternet.ru/images/attach/c/2/70/570/70570132_1297510431_tn00000B.jpg',
'http://us.cdn3.123rf.com/168nwm/patrickrp/patrickrp0712/patrickrp071200095/2225281-ein-katzchen-ruhen.jpg',
'http://www.1zoom.net/big2/68/214229-svetik.jpg',
'http://hq-wallpapers.ru/wallpapers/6/hq-wallpapers_ru_animals_27448_prevue.jpg',
'http://www.mailce.com/wp-content/uploads/2011/07/beyaz-kedi1.jpg',
'http://cs7003.userapi.com/v7003382/1043/TgtvDgLzAws.jpg',
'http://img.izifunny.com/pics/20120409/640/kittens-100-pics_66.jpg',
'http://www.tarzroket.com/data/media/12/3103780f.jpg',
'http://thumbs.myopera.com/sz/colx/snackdragon/albums/6149641/Copy%20of%2012365046105YY1SH2.jpg',
'http://a.nevomedia.ru/files/media/images/account/00/000/506/375/upic168/avatar_13126254475469.png',
'http://cs5456.userapi.com/u125082845/-14/q_cf11c93b.jpg',
'http://pazitiff.info/uploads/posts/2012-04/1334269365_004.jpg',
'http://pappagallogiallo.com/wp-content/uploads/2012/07/0288.jpg',
'http://s020.radikal.ru/i718/1301/e8/f1012a6a578a.jpg',
'http://cs323824.userapi.com/v323824487/15ce/hIyg7SejaVg.jpg',
'http://i072.radikal.ru/0807/55/adda2df66288t.jpg',
'http://kasha-malasha.ucoz.ru/_ph/11/565140891.jpg',
'http://www.fotokoshki.ru/3/koshki6342.jpg',
'http://adengo.ru/images/notice/147468.jpg',
'http://deluxelady.ru/uploads/posts/2013-07/1373831964_vospitanie-koshki-v-dome-1024x640.jpg',
'http://prikol.eu/uploads/posts/2013-05/1368740156_demotivatory.12335.jpg',
'http://img.izifunny.com/pics/20120409/640/kittens-100-pics_91.jpg',
'http://i041.radikal.ru/1103/d6/1d06013ee167.jpg',
'http://www.lesruk.net/imagesbin/6428_7dwi8zcaju38qmcatlps.jpg',
'http://file.mobilmusic.ru/fb/c8/0b/627350-240.jpg',
'http://1.bp.blogspot.com/-eJGxLAtSI_g/TxWm3ZeJKpI/AAAAAAAAIgA/oWp0TBFAVyI/s1600/104+%252830%2529.jpg',
'http://assets2.desktopnexus.com/thumbnails/432915-thumbnail.jpg',
'http://www.zootorg.com/images/normal/7390.jpg',
'http://www.zgrad.net/images/preview/189613_240.jpg',
'http://doseng.org/uploads/posts/2009-07/1247036129_fotopodborka-017.jpg',
'http://kotoff.org/images/phocagallery/hq/70_cliparts/049.jpg',
'http://cs10908.vk.me/g32083485/a_576f5e54.jpg',
'http://s13.radikal.ru/i186/1110/b5/b415f3ac63b5.jpg',
'http://file.mobilmusic.ru/fb/c8/0b/627350-480.jpg',
'http://i.obozrevatel.ua/8/830427/gallery/79741_image_large.jpg',
'http://file.mobilmusic.ru/b4/6f/81/594582-320.jpg',
'http://cs5740.userapi.com/u118514621/-14/x_e18cbc30.jpg',
'http://www.chlb.info/images/normal/53738.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141192_kittens_76.jpg',
'http://dooi.com.ua/wp-content/uploads/2012/02/clip_image0154.jpg',
'http://desktopwallpapers.org.ua/download.php?img=201207/640x480/desktopwallpapers.org.ua-18018.jpg',
'http://monk.com.ua/images/articles/20080708193622359_6.jpg',
'http://file.mobilmusic.ru/8a/00/61/717918-160.jpg',
'http://thumb.yyz.chan.yiffy.tk/1223080727118378240.jpg',
'http://www.thewallpapers.org/photo/55252/Cute-Cats-008.jpg',
'http://www.mp3stahuj.cz/img_db/2009/October/srandamix279/26695.jpg',
'http://img.izifunny.com/pics/20120409/640/kittens-100-pics_77.jpg',
'http://3.bp.blogspot.com/-RytfDU8WVJg/T5NZVp6TbZI/AAAAAAAACFg/9ia9wrtOjGs/s320/exhausted+kittens.jpg',
'http://pappagallogiallo.com/wp-content/uploads/2012/07/0492.jpg',
'http://cdn.biserko.mk/wp-content/uploads/2012/03/macka-se-plasi-od-pravosmukalka-150x150.jpg',
'http://pappagallogiallo.com/wp-content/uploads/2012/07/0592.jpg',
'http://cdn-nus-1.pinme.ru/pin-upload-static/photos/d1ca52531c5f8628ca0d0517285fa5ac_m.jpg',
'http://gavmiy.ru/wp-content/uploads/2013/06/kot8-282x300.jpg',
'http://f1.live4fun.ru/pictures/img_27772185_2723_0.jpg',
'http://p3.s1.flirtic.com/photos/1/0/9/1097363576.jpg',
'http://angelsdesktopwallpapers.com/Gallery\\animals\\Cats\\thm_cute_15.jpg',
'http://ic.pics.livejournal.com/irina_dalmatin/40417568/3263/3263_640.jpg',
'http://static02.rupor.sampo.ru/7124/092eb080a14c3244889e66c62ccdc26f.jpg',
'http://ligavags.narod.ru/kot.jpg',
'http://photo.bear.com.ua/albums/kotographia/17028644_16909131_v_korzinke.sized.jpg',
'http://www.wallpapers10.net/wp-content/uploads/images/32/cats.jpg',
'http://cs10349.vk.me/u161102916/150988265/x_a08c6bbb.jpg',
'http://i1.i.ua/prikol/pic/5/9/433495_417341.jpg',
'http://animals-ru.ucoz.ru/_ld/0/s97037536.jpg',
'http://usivsmetane.narod.ru/iCat/01/goluboj_IMGP4535.jpg',
'http://f1.live4fun.ru/small_pictures/img_6061667_819_10.jpg',
'http://www.open-mmx.de/data/Image/personalcard/76310-2n.jpg',
'http://webweek.ru/uploads/posts/2011-04/thumbs/1302498737_1005.jpg',
'http://khongthe.com/wallpapers/animals/cat-40407.jpg',
'http://cdn.attackofthecute.com/May-29-2013-21-07-08-aa.jpg',
'http://funzoo.ru/uploads/posts/2011-04/thumbs/1303930754_presents_cat011.jpg',
'http://www.look.com.ua/download.php?file=201209/640x480/look.com.ua-28031.jpg',
'http://img0.liveinternet.ru/images/attach/c/3/75/33/75033038_large_picturecontentpid2db1d.jpg',
'http://s1.goodfon.ru/image/322061-2048x1237.jpg',
'http://pappagallogiallo.com/wp-content/uploads/2012/07/0861.jpg',
'http://foto-jumor.ru/_ph/12/109268994.jpg',
'http://www.newsmo.ru/wp-content/uploads/2012/03/Kotenok-milashka.jpg',
'http://www.sobiratel.net/files/thumbs/t_3604_1348334787.jpg',
'http://cs309121.userapi.com/v309121272/5802/PbKuLAMGdhA.jpg',
'http://file.mobilmusic.ru/ae/36/d0/737267-320.jpg',
'http://www.superedo.it/sfondi/sfondi/Animali/Gatti/PPPIcons/gatti_1.jpg',
'http://doblelol.com/thumbs/the-funny-cat-video_4897792760940946.jpg',
'http://www.mailce.com/wp-content/uploads/2011/07/beyaz-kedi-125x125.jpg',
'http://www.theplace.ru/archive/pic_animals/img/04-2_s.jpg',
'http://static.igre123.com/images/forum/posts/8/5c1c4222e108e4c58e88cc1bb059db78.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141143_kittens_65.jpg',
'http://www.dreamscity.net/vb/imgcache/2/9640dreamscity.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141197_kittens_36.jpg',
'http://www.motto.net.ua/mini/201209/30033.jpg',
'http://rsm.haber365.com/H/1294999533_22_sweet_funny_animal_photos-5.jpg',
'http://cs11036.userapi.com/u139809067/-14/p_eeb76ad3.jpg',
'http://www.wallpage.ru/imgbig/wallpapers_46832.jpg',
'http://nevseoboi.com.ua/uploads/posts/2010-08/1282764229_5.jpg',
'http://www.xa-xa.org/uploads/posts/2012-06/1339877932_kotiki_2.jpg',
'http://pics2.pokazuha.ru/p442/o/p/6856754kpo.jpg',
'http://www.nastol.com.ua/pic/201203/960x800/nastol.com.ua-19039.jpg',
'http://cs304203.userapi.com/v304203955/2a35/AynrhfE0JRE.jpg',
'http://www.telefoner.ru/preview/images/88042.jpg',
'http://tripgoa.ru/wp-content/uploads/2013/06/a_5cfa64db.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141156_kittens_56.jpg',
'http://sfw.so/uploads/posts/2010-06/1275894841_192eb1152d75.jpg',
'http://wallpapers.pixpux.com/thumbs/funny_animals_47-t2.jpg',
'http://cs405019.userapi.com/v405019631/6991/P7PkXQ50i-Q.jpg',
'http://content.foto.mail.ru/mail/le-cvetogorez/_answers/i-21.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141116_kittens_16.jpg',
'http://wpapers.ru/wallpapers/animals/Cats/11549/1400x1050_%D0%97%D0%B5%D0%B2%D0%B0%D1%8E%D1%89%D0%B8%D0%B9-%D0%BA%D0%BE%D1%82%D0%B5%D0%BD%D0%BE%D0%BA.jpg',
'http://cs323516.userapi.com/g43899818/a_d80fc214.jpg',
'http://pazitiff.info/uploads/posts/2011-07/thumbs/1311941236_023.jpg',
'http://assets2.desktopnexus.com/thumbnails/1174453-thumbnail.jpg',
'http://static.lacuarta.com/20121212/1669999_60.jpg',
'http://pixdaus.com/files/items/pics/6/22/16622_585d44fca636d5dc0d25b7c76f87992a_large.jpg',
'http://lemotan.users.photofile.ru/photo/lemotan/2252858/small/61031636.jpg',
'http://bomz.org/i/lol/thumb_173272-2010.11.14-11.09.09-bomz.org-lol__prikol_meshaet_rabotat.jpg',
'http://28.media.tumblr.com/tumblr_m2wmkuw79W1r8adfjo1_500.jpg',
'http://www.resimbul.com/sonuc/kedi/sarman-kedi/sarman-kedi-06b96d.jpg',
'http://www.sdomom.ru/upload/animals/kotiki.jpg',
'http://abrosait.ru/wp-content/uploads/2008/07/2225281_blog.jpg',
'http://cs308724.vk.me/v308724862/6e0e/VXFiG7PT7JQ.jpg',
'http://olga-koshka.ucoz.ru/_ph/1/1/365570789.jpg',
'http://www.fotokoshki.ru/3/thumbnails/thumbkoshki6342.jpg',
'http://file.mobilmusic.ru/6a/62/54/586285-a.jpg',
'http://www.resimcim.net/resimler/hayvan-resimleri/sevimli-yavru-kedi-resimleri-13563870191261-orta.jpg',
'http://img244.imageshack.us/img244/6233/ninhawycats115cd7.jpg',
'http://file.mobilmusic.ru/b4/6f/81/594582-160.jpg',
'http://www.zootorg.com/images/normal/185293.jpg',
'http://3.bp.blogspot.com/_wZOGNvdBnME/SbR_0PPAXZI/AAAAAAAAABo/C_oEN9crPRc/s320/brothers.jpg',
'http://cs411216.userapi.com/v411216151/4ff7/oVwZd8woodI.jpg',
'http://img.narodna.pravda.com.ua/images/doc/4/5/457f0-inart020262106.jpg',
'http://cs11216.userapi.com/u52939623/147576625/s_dcb002a9.jpg',
'http://cool-salochki.narod.ru/olderfiles/1/091700704994b39457a2528991f4b243.jpg',
'http://img1.cfstatic.com/wallpapers/7a1ce3d6374eb9a9f73e6afa514e48b6_w194.jpg',
'http://www.ramlife.ru/img/0007/12782-c5bab7e8_800.jpg',
'http://www.dogandcat.ru/files/images/000-12-1024x768.preview.jpg',
'http://runews.radeant.com/top/image/2008/11/22/nu-chto-ti-smotrish-na-meniai.jpg',
'http://www.juokai.lt/public/files/posts/images/3055/gyvunu-nuotraukos_2.jpg',
'http://pi.at.ua/_ph/5/635303205.jpg',
'http://hdimg.ru/_ph/1/45446909.jpg',
'http://cs10927.userapi.com/u7047979/-14/x_b920965c.jpg',
'http://nevsepic.com.ua/uploads/posts/2011-10/thumbs/1318104698_28_www.nevsepic.com.ua.jpg',
'http://ybobra.ru/uploads/url/148.jpg',
'http://cs317326.userapi.com/v317326667/630f/mxA-DNNjTLI.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141141_kittens_30.jpg',
'http://www.allfons.ru/pic/201301/1400x1050/allfons.ru-19988.jpg',
'http://rewalls.com/pic/201101/1280x960/reWalls.com-19026.jpg',
'http://privet.mobi/files/fpics/1/7730/orig.jpg',
'http://xn--b1agjedwoje7c.xn--p1ai/foto:img/35995/w:350/h:70/null/img.jpg',
'http://thumbpress.com/wp-content/uploads/2012/07/Fluffiest-kitty-150x150.jpg',
'http://www.zoovet.ru/forum_foto/s499031.jpg',
'http://pic.fotico.ru/08/088/508808.jpg',
'http://drunov.ru/upload/iblock/1c6/1c6ce55b0b348c72bbb120b92c74af37.jpg',
'http://www.resimbul.com/sonuc/kedi/honey-bear-kedi/honey-bear-kedi-17ea18.jpg',
'http://wpapers.ru/wallpapers/animals/Cats/11549/1280x800_%D0%97%D0%B5%D0%B2%D0%B0%D1%8E%D1%89%D0%B8%D0%B9-%D0%BA%D0%BE%D1%82%D0%B5%D0%BD%D0%BE%D0%BA.jpg',
'http://pappagallogiallo.com/wp-content/uploads/2012/07/0641.jpg',
'http://www.wallpage.ru/imgbig/wallpapers_47474.jpg',
'http://hq-walls.ru/foto/10/seryy_zhivotnye_kotenok_ryzhiy_kot_1920x1200.jpg',
'http://www.superedo.it/sfondi/sfondi/Animali/Gatti/gatti_1.jpg',
'http://2krota2.ru/uploads/posts/2011-09/1315917459_1315840633_kitty_08.jpg',
'http://cs10068.userapi.com/u10584160/-6/x_d8253f77.jpg',
'http://cwer.ws/media/files/u56726/kitten_5.jpg',
'http://www.zootorg.com/images/normal/214553.jpg',
'http://webweek.ru/uploads/posts/2010-04/thumbs/1272616576_1272393129_prikolniye_kartinki15.jpg',
'http://copypast.ru/foto8/1850/interesnye_fakty_pro_tykvu_1.jpg',
'http://wap.unsveta.com/images/3275cz320x240.jpg',
'http://www.hullumaja.com/files/pictures/2012/12/04/thumbs/Lm5wdzabzx.jpg',
'http://vtakt.ru/u_photo/b/129814959285683.jpg',
'http://legend.az/uploads/posts/2010-10/thumbs/1286456788_13.jpg',
'http://img.galya.ru/galya.ru/Pictures2/humor_photo/2012/01/27/t4_3010079.jpg',
'http://static.1ms.net/media/1/playful-kitty-81042.jpg',
'http://kowel.at.ua/_nw/7/s88782246.jpg',
'http://www.zoovet.ru/forum_foto/s499995.jpg',
'http://izhlife.ru/uploads/posts/newsimg/img-48556.jpg',
'http://photohumor.ru/_ph/7/738676009.jpg',
'http://cs12814.vk.me/u29459237/video/l_affff52c.jpg',
'http://www.artleo.com/mini/201206/27301.jpg',
'http://love.love.love.sara.ybobra.ru/uploads/url/148.jpg',
'http://file.mobilmusic.ru/51/99/0c/884013-320.jpg',
'http://www.freeoboi.ru/images/991754310.jpg',
'http://www.ashpazonline.com/picdump/256602ashpazonline_weblog_1260628519.jpg',
'http://c825.ucoz.ru/_ph/30/1/372872413.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141219_kittens_63.jpg',
'http://www.good-cook.ru/i/big/f/f/ffbc4f5f941a2a8424a460a5cc894bbb.jpg',
'http://static.lolkot.ru/images/users/avatars/34385_50.jpg',
'http://kotomatrix.ru/images/lolz/2011/03/27/866621.jpg',
'http://www.tamboff.ru/forum/files/thumbs/t_5526_britanskaya_koshka_150.jpg',
'http://sphotos-a.ak.fbcdn.net/hphotos-ak-prn1/c66.0.403.403/p403x403/560330_331944516876994_167836777_n.jpg',
'http://www.resimcim.net/resimler/hayvan-resimleri/sevimli-yavru-kedi-resimleri-13563870176859-orta.jpg',
'http://bb.rusbic.ru/photo/trade/trade_112995_0.jpg',
'http://static.lolkot.ru/images/thumbnails/vsyo-yeschyo-kipyatite_1335443571_140x140.jpg',
'http://rewalls.com/pic/201109/1280x1024/reWalls.com-48499.jpg',
'http://img.izifunny.com/pics/20120409/640/kittens-100-pics_8.jpg',
'http://cs518421.vk.me/u164444043/video/m_6cb388b6.jpg',
'http://ok.ya1.ru/uploads/posts/2008-08/1218103729_wallpapers_180.jpg',
'http://oboi-god.ucoz.ru/_ph/9/1/898156596.jpg',
'http://img1.liveinternet.ru/images/foto/b/3/apps/0/86/86783_kitty__kitty___by_hoschie[1].jpg',
'http://cf067b.medialib.glogster.com/media/23/23df93072df69096b15553bb63f27e7cb02abf1488bb32656f2e96052ba250b6/lolz-jpg.jpg',
'http://kisakuku.ru/news/images-up/12210/12210_26_832279704591c4bfbf074d1874bcb4c8.jpg',
'http://www.wallpage.ru/imgbig/wallpapers_19392.jpg',
'http://wallportal.de/wallpapers/83ff3d1682668e14fb0950b774387d24/804_4.jpg',
'http://www.motto.net.ua/pic/201209/1024x768/motto.net.ua-9351.jpg',
'http://khongthe.com/wallpapers/animals/nighty-night-14855.jpg',
'http://justcats.ru/_nw/26/s25547850.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141125_kittens_01.jpg',
'http://media-cache-ec1.pinterest.com/avatars/janetltait-10_600.jpg',
'http://yawall.ru/images/Jivotnie-oboi-foto-izobrajeniya-jivotnih/1920x1080/52106-Malenkiy-kotenok-potyagivaetsya-sprosonya-1920x1080.jpg',
'http://www.greenmama.ru/dn_images/00/00/00/00/1187623836a51274992a7d.jpg',
'http://postrussia.info/wp-content/uploads/2013/06/%D0%BA%D0%BE%D1%82%D0%B5%D0%BD%D0%BE%D0%BA-%D0%BF%D1%8C%D0%B5%D1%82-%D0%B8%D0%B7-%D1%81%D1%82%D0%B0%D0%BA%D0%B0%D0%BD%D1%87%D0%B8%D0%BA%D0%B0-197x300.jpg',
'http://s40.radikal.ru/i087/1003/32/85dd341d898f.jpg',
'http://www.cutekittenz.com/Kittens/Make%20a%20Silly%20Face.jpg',
'http://joker.vhabare.ru/uploads/posts/1303855836_1303776972_1303725168_normal_1210160603_0004.jpg',
'http://pics2.pokazuha.ru/p442/y/u/6856741iuy.jpg',
'http://file.mobilmusic.ru/47/51/0a/911306.jpg',
'http://img2.1001golos.ru/ratings/406000/405723/pic2.jpg',
'http://www.greenmama.ua/dn_images/00/00/00/00/1187623836a51274992a7d.jpg',
'http://images.farfesh.com/articles_images/1FARFESHPHOTOS/COOL_PHOTOS/Cool-Photos/Cool-Photos15.jpg',
'http://www.greenmama.ru/dn_images/00/22/51/09/1208446092a51274992a7d.jpg',
'http://www.terso1.ru/files/users/90/.jpg_300_113.jpg',
'http://s19.postimg.org/6b686krwj/3924971445_12e6487841_z.jpg',
'http://www.stroiniashka.ru/_fr/5/s3350571.jpg',
'http://cs5959.userapi.com/u161334038/-5/x_baab93ea.jpg',
'http://funzoo.ru/uploads/posts/2009-10/thumbs/1254502196_cats-28.jpg',
'http://1.bp.blogspot.com/-GzdhlF47cls/TwZpd_opb5I/AAAAAAAAAh0/E8o-f3DBV6Q/s1600/070610_04-943-1-_tplq.jpg',
'http://file.mobilmusic.ru/fb/c8/0b/627350-80.jpg',
'http://i1.cdnds.net/12/14/M/odd_terrified_kitten_1.jpg',
'http://images.petovod.ru/2012/03/29/133302525880.jpg',
'http://img.izifunny.com/pics/20120409/640/kittens-100-pics_45.jpg',
'http://a0.twimg.com/profile_images/1570864670/chat_normal.jpg',
'http://cats.firefun.ru/images/gallery/07/07851-84729271-cats.firefun.ru.jpg',
'http://www.ruyatabirleri.net.tr/wp-content/uploads/merak-etmek-150x150.jpg',
'http://i009.radikal.ru/0907/d3/ff33a03a9369.jpg',
'http://www.allfons.ru/pic/201211/800x600/allfons.ru-17903.jpg',
'http://stuffpoint.com/cat/image/164809-cat-cats.jpg',
'http://www.scorp12on.narod.ru/images/wallpapers_cats_203.jpg',
'http://img3.proshkolu.ru/content/media/pic/std/1000000/929000/928648-5440a44654d39b58.jpg',
'http://cs316823.vk.me/v316823103/6760/2WYsKj6-RDc.jpg',
'http://img134.imageshack.us/img134/5998/816cw5.jpg',
'http://cs309122.vk.me/v309122657/7358/W69kMkLhXyc.jpg',
'http://i5.minus.com/jV3sYONV3auCI.jpg',
'http://ledyolga.ru/wp-content/uploads/2010/10/%D0%BA%D0%BE%D1%88%D0%BA%D0%B8+-%D0%BA%D1%80%D0%B0%D1%81%D0%BE%D1%82%D0%B0.jpg',
'http://aif.by/media/k2/items/cache/f2c93c7291d1063f564a0a69d1fecbd8_M.jpg',
'http://3.bp.blogspot.com/_jOlMVliZ3FM/S5iLvH_Yg8I/AAAAAAAAAE0/BEqHn4PS-dk/s320/funny-pictures-little-kittens-are-exhausted.jpg',
'http://arctur-1.narod.ru/animals/Cats/images/127_5524.jpg',
'http://2.bp.blogspot.com/-1r17K4Ltuqc/TpUga_y1VyI/AAAAAAAACo8/uMbSbGmInSQ/s1600/%25D0%25BF%25D1%2580%25D0%25B8%25D1%2580%25D1%2583%25D1%2587%25D0%25B8%25D0%25BB%25D0%25B8+%25D0%25BA%25D0%25BE%25D1%2588%25D0%25BA%25D1%2583.jpg',
'http://forum.vsalde.ru/uploads/profile/photo-thumb-2750.jpg',
'http://i075.radikal.ru/0907/e2/5026c6ea8529.jpg',
'http://spoki.tvnet.lv/upload/users/61/61893/profileImage/profileImage.jpg',
'http://content.foto.mail.ru/inbox/yes.s/_answers/i-2947.jpg',
'http://megalife.com.ua/uploads/posts/2008-04/thumbs/1209038636_klassnye_kotjata_42_foto_15.jpg',
'http://img.izifunny.com/pics/20120409/640/kittens-100-pics_57.jpg',
'http://wallpapers.pixpux.com/thumbs/funny_animals_47-t1.jpg',
'http://www.phanngochien.com/view/1/AN039/1600cat_2007.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141209_kittens_40.jpg',
'http://www.clopotel.ro/utile/felicitari/felicitari/felicitare520b.jpg',
'http://www.bigpicture.in/wp-content/uploads/2010/03/BeautyOfMicroPhotosbySortVind25.jpg',
'http://img1.liveinternet.ru/images/attach/b/3/10/390/10390823_1196621449_kotik_temka_dlya_dneva.jpg',
'http://moikartinki.ru/pics/t/s-3184.jpg',
'http://ifs.cook-time.com/preview/img85/85737.jpg',
'http://starosubhangulovo.sindom.ru/upload/s/p/u/i/1_kotenok-milashka.jpg',
'http://ps-cs.ucoz.ru/_ld/23/2337.jpg',
'http://99px.ru/sstorage/56/2011/09/11409110104208493_tmb.jpg',
'http://file.mobilmusic.ru/6a/62/54/586285.jpg',
'http://files.web2edu.ru/1387fc85-e66a-4f2f-b454-cc7ac1a7b8ec/93384604-4aab-4301-a0d5-656338ba205d.jpg',
'http://luxfon.com/mini/201203/7217.jpg',
'http://kirsmi.ru/uploads/19012.jpg',
'http://img.izifunny.com/pics/20120409/640/kittens-100-pics_47.jpg',
'http://cetki.com/uploads/posts/thumbs/1246993867_043.jpg',
'http://avatarmaker.net/free-avatars/avatars/animals_216/cats_2_c/kitty_truckers_avatar_56809.jpg',
'http://www.doodoo.ru/uploads/posts/2010-06/funny-fotos-068.jpg',
'http://fido20.ru/Content/People/13247/b_13247_1.jpg',
'http://frame4.loadup.ru/57/e9/1177479.8.3.jpg',
'http://i015.radikal.ru/0804/ba/2795ff0eaf33.jpg',
'http://s4.live4fun.ru/pictures/s3img_13585366_2386_3.jpg',
'http://file.mobilmusic.ru/b9/67/c5/384964-a.jpg',
'http://file.mobilmusic.ru/db/70/2b/849569-240.jpg',
'http://cs319830.userapi.com/v319830320/48bf/iom23-EfSP4.jpg',
'http://kinotet.ru/bfvko/kak_skachat_tumani_items_dlya_maynkraft_1_5_2_8385_8.jpg',
'http://img.playground.ru/images/3/8/images.jpg',
'http://file.mobilmusic.ru/07/44/9c/928100-320.jpg',
'http://i.ucrazy.ru/files/i/2008.12.24/1230056270_1209038757_kittens_01.jpg',
'http://desktopwallpapers.org.ua/pic/201110/1280x1024/desktopwallpapers.org.ua-6796.jpg',
'http://pazitiff.info/uploads/posts/2012-04/1334269354_021.jpg',
'http://barbi555555.p.fl3.fo.ru/thumbnail/chunk11/456679/21099/small_kotenok1.jpg.jpg',
'http://www.poetryclub.com.ua/upload/poem_all/00262648.jpg',
'http://web3.protv.ro/assets/gandesteliber/rgt_talentat/facebook/ee732d1f6e1aa0445e1c07987bd2c890cdd376c7.jpg',
'http://www.ass.lv/img_thumbs/22_d010f/201302/9824.jpg',
'http://pappagallogiallo.com/wp-content/uploads/2012/07/0671.jpg',
'http://kumertau.sindom.ru/upload/s/p/u/i/1_kotenok-milashka.jpg',
'http://hq-wallpapers.ru/wallpapers/6/hq-wallpapers_ru_animals_27448_1280x1024.jpg',
'http://cs421331.userapi.com/v421331041/1f16/ZyWC1OxdJBI.jpg',
'http://open.az/uploads/posts/2012-08/1344237160_17.jpg',
'http://ewandoo.co/uploads/2012/02/cat06.jpg',
'http://bb.rusbic.ru/photo/trade/trade_112995_1.jpg',
'http://jpegs.at.ua/_ph/9/282959417.jpg',
'http://img.izifunny.com/pics/20120409/640/kittens-100-pics_86.jpg',
'http://www.uaimages.com/images/80692k_18.jpg',
'http://www.lawofattraction.ru/_fr/2/s7736806.jpg',
'http://startdeutsch.ru/download/file.php?avatar=4493_1369141950.jpg',
'http://media.vatgia.vn/user_image/small_yqk1247222302.jpg',
'http://pappagallogiallo.com/wp-content/uploads/2012/07/0374.jpg',
'http://desktopwallpapers.org.ua/download.php?img=201110/320x240/desktopwallpapers.org.ua-6084.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141150_kittens_85.jpg',
'http://www.berikota.ru/Sites/berikota_ru/Cache/3/3031e13bd06a012846897316b445097f.jpg',
'http://megalife.com.ua/uploads/posts/2008-11/1225831697_1194206711_caeef2fff2e020e220f6e2e5f2eef7edeeec20e.jpg',
'http://crosti.ru/patterns/00/04/6c/16f28301e4/preview.jpg',
'http://xproggn.net/images/data/2/5/big.25be8481a44aa709cb96578e53f648b8.jpg',
'http://img218.imageshack.us/img218/3885/427ue3.jpg',
'http://love.r.love.link.ybobra.ru/uploads/url/148.jpg',
'http://files2.fatakat.com/2012/7/13416976039603.jpg',
'http://uh.ru/files/a/69/6749/images/cats-wallpaper-2-21.jpg',
'http://logicaecologica.files.wordpress.com/2012/11/gatito.jpg',
'http://demedovka.ucoz.ru/_ph/9/464417959.jpg',
'http://s09.radikal.ru/i182/1306/46/9469902ecb18.jpg',
'http://www.fotokoshki.ru/6/thumbnails/thumbkoshki3872.jpg',
'http://altaiskiy-krai.doski.ru/i/51/49/514912.jpg',
'http://img-6.photosight.ru/171/3209082_large.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141127_kittens_39.jpg',
'http://www.funnykittensite.com/pictures/i_likes_milk.jpg',
'http://aboutanimals.ru/Ads/preview/919250.jpg',
'http://hq-oboi.ru/photo/koshki_65_1920x1200.jpg',
'http://byaki.net/uploads/posts/2011-09/1315840641_kitty_03.jpg',
'http://www.catsmob.com/post/2012/01/00207/cats_cm_20120114_00207_051.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141166_kittens_10.jpg',
'http://img.izismile.com/img/img4/20110513/640/these_funny_animals_690_640_35.jpg',
'http://innocentenglish.com/daily-break/cute-animals/cute-kitten-image.jpg',
'http://img74.imageshack.us/img74/5790/r780aufb6.jpg',
'http://uwd.ru/uploads/posts/2012-04/1334141200_kittens_90.jpg',
'http://cs1692.vk.me/g9926612/a_2310451a.jpg',
'http://picfun.ru/uploads/posts/2009-06/1245214464_10.jpg',
'http://avata.ucoz.ru/_fr/0/4518008.jpg',
'http://www.anime-zone.ru/inc/user_pictures/ximul/small/ximul2.jpg',
'http://megalife.com.ua/uploads/posts/2010-06/1276547553_1194206705_caeef2fff2e0203131.jpg',
'http://img.izifunny.com/pics/20120409/640/kittens-100-pics_40.jpg',
'http://www.humoranimal.com/fotos/bocado-gatos-315_p.jpg',
'http://hq-wallpapers.ru/wallpapers/12/hq-wallpapers_ru_animals_57264_prevue.jpg',
'http://jwblackboard.com/cute-cat-wallpaper-desktop-219.jpg',
'http://kotomatrix.ru/images/fotos/2012/01/29/preview/8H.jpg',
'http://i055.radikal.ru/1109/b8/e8361c78f7b8t.jpg',
'http://kotomatrix.ru/images/lolz/2009/10/24/385656.jpg',
'http://www.quiztron.com/images_quiz/2011/01/01/100_408043578.jpg',
'http://www.lookatvideo.com/humour/lolcats/chaton-peur-aspirateur.jpg',
'http://content.foto.mail.ru/mail/darsi2000/174/p-117.jpg',
'http://cs302208.userapi.com/u174845393/a_7171641d.jpg',
'http://desktopwallpapers.org.ua/download.php?img=201110/800x480/desktopwallpapers.org.ua-6084.jpg',
'http://zastavka.at.ua/_ph/23/22240658.jpg',
'http://www.zoopets.ru/photo/preview/3498-kitten.jpg',
'http://frame2.loadup.ru/86/62/1686329.1.3.jpg',
'http://www.all4pet.ru/thumb/notice-thumb/app/upload/obj/iblock_media/210000/203178/original/gallery_fotometki_image_3cfebf83.jpg',
'http://www.aladanh.com/data/thumbnails/47/cat57.jpg',
'http://img.izifunny.com/pics/20120409/640/kittens-100-pics_37.jpg',
'http://statics.photodom.com/photos/2007/08/30/thumb_466937.jpg',
'http://www.zootorg.com/images/normal/164744.jpg',
'http://albums.res.oho.lv/511948/mid_10688.jpg',
'http://img.dayazcdn.net/250x0s/clickable/0f/7/356307_018.jpg',
'http://cs529410.vk.me/u173297758/video/s_015b7f46.jpg',
'http://www.wallpea.com/wp-content/uploads/2013/05/cute-cat-Wallpaper-1-640x480.jpg',
'http://s3.uploads.ru/2pl3G.png',
'http://files.moji-mazlici.webnode.cz/200000002-a33e7a4383/Kocicka.jpg',
'http://darupurwitapo.files.wordpress.com/2009/07/dijual-anak-kucing-persia-dan-himalayan-baru.jpg',
'http://avatarko.ru/usergallery/16/avatar168.jpg',
'http://www.fotolive.ru/ts/8/1239971450.jpg',
'http://cs316130.userapi.com/u37498245/a_f929662e.jpg',
'http://moikartinki.ru/pics/t/3184.jpg',
'http://2krota.ru/uploads/posts/2010-09/1284387615_cats_and_dogs_4_34.jpg',
'http://www.kotiki.ru/bgimg/Chat47[1].jpg',
'http://img.galya.ru/galya.ru/Pictures2/humor_photo/2009/07/10/t4_1346464.jpg'];

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

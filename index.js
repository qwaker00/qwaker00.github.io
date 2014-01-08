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

function add_own(w) {
	if (prompt('Введите свой вариант перевода слова "' + w + '"', "")) {
		alert("Спасибо! Ваш вариант перевода принят на рассмотрение!");
	}
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

                    if (lang.substring(0, 2) == 'en') $('<div/>', {title: "Произнести", class: 'say', 'phrase': def.text}).text('.').click(sayIt).appendTo(main);

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
                $('<div/>', {class: 'add_own', text: 'Добавить свой вариант перевода'}).click(function(){ return add_own(text);}).appendTo(output);

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
			            $('<div/>', {class: 'add_own', text: 'Добавить свой вариант перевода'}).click(function(){ return add_own(text);}).appendTo(output);
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
'http://bylix.com/uploads/posts/2009-11/thumbs/1258172308_1258085418_cats_best_lx_072.jpg',
'http://desktopwallpapers.org.ua/download.php?img=201110/320x240/desktopwallpapers.org.ua-6796.jpg',
'http://www.motto.net.ua/mini/201209/26403.jpg',
'http://2.bp.blogspot.com/-p1j4xnoiIJw/TWW-po1u2GI/AAAAAAAAAHk/CCsCGjA3Jig/s1600/kucing3.jpg',
'http://mobilepics.ru/uploads/pictures/animals/animals-6082.jpg',
'http://s020.radikal.ru/i720/1304/6a/03e5fd4d0274.jpg',
'http://pazitiff.info/uploads/posts/2011-07/thumbs/1311941247_016.jpg',
'http://inima.ru/wp-content/uploads/2013/01/Small_Kitty_iPod.jpg',
'http://podruzhki.ru/data/wall/37185/3ba8795f6d7065ed9b7f4f056ff906c2.jpg',
'http://cs9767.userapi.com/u133348566/a_56bb9a15.jpg',
'http://privet.mobi/files/fpics/1/7734/mobile.jpg',
'http://files.seclub.org/pic/4/d/0/4d0408196609ca47dafb76658ff1160f.jpg',
'http://www.blogol.hu/pikz/cicumicu/126065.jpg',
'http://pixdaus.com/files/items/pics/0/8/292008_c85295a89de1386c9c7dba65b5171abe_mdsq.jpg',
'http://file.mobilmusic.ru/78/1a/b3/605678-320.jpg',
'http://f1.live4fun.ru/small_pictures/img_20339136_106_13.jpg',
'http://s52.radikal.ru/i136/1210/20/640598ef4581.jpg',
'http://i.ucrazy.ru/files/i/2012.10.22/1350922643_222222222222222-76.jpg',
'http://www.vancats.ru/images/Ricardo_Oliveira_5min.jpg',
'http://cs316130.userapi.com/u37498245/a_f929662e.jpg',
];

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

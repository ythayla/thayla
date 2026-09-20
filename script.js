/* navegacao por scroll: rola ate a secao, revela ao entrar e marca no menu */
(function() {
    var abas   = document.querySelectorAll('.tab');
    var secoes = document.querySelectorAll('.content-section');
    if (!abas.length) return;

    abas.forEach(function(aba) {
        aba.addEventListener('click', function() {
            var alvo = document.getElementById(aba.getAttribute('data-page'));
            if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function(entradas) {
            entradas.forEach(function(en) {
                if (en.isIntersecting) {
                    en.target.classList.add('on');
                    obs.unobserve(en.target);
                }
            });
        }, { threshold: 0.1 });
        secoes.forEach(function(s) { obs.observe(s); });
    } else {
        secoes.forEach(function(s) { s.classList.add('on'); });
    }

    function espia() {
        var y = window.scrollY + 170;
        var atual = '';
        secoes.forEach(function(s) { if (s.offsetTop <= y) atual = s.id; });
        abas.forEach(function(a) {
            a.classList.toggle('active', a.getAttribute('data-page') === atual);
        });
    }
    window.addEventListener('scroll', espia, { passive: true });
    espia();
})();

var uiHidden = false;
function toggleUI() {
    var content = document.getElementById('content');
    var icon = document.getElementById('view-icon');
    var overlay = document.getElementById('overlay');
    if (overlay && overlay.style.display !== 'none') return;

    if (uiHidden) {
        content.style.opacity = '0';
        content.style.pointerEvents = 'none';
        if (icon) icon.className = 'fas fa-eye-slash';
    } else {
        content.style.opacity = '1';
        content.style.pointerEvents = 'auto';
        if (icon) icon.className = 'fas fa-eye';
    }
}
document.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    if (e.repeat) return;
    uiHidden = !uiHidden;
    toggleUI();
});
document.getElementById('view-toggle').addEventListener('click', function() {
    uiHidden = !uiHidden;
    toggleUI();
});

function copyName(text) {
    navigator.clipboard.writeText(text);
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 1600);
}

(function() {
    var DISCORD_ID = '947175002007015484';
    var dot = document.getElementById('status-dot');
    var text = document.getElementById('status-text');
    if (!text) return;

    var labels = { online: 'online', idle: 'ausente', dnd: 'ocupada', offline: 'offline' };

    function update() {
        fetch('https://api.lanyard.rest/v1/users/' + DISCORD_ID)
            .then(function(r) { return r.json(); })
            .then(function(res) {
                if (!res.success) {
                    text.textContent = 'offline';
                    dot.className = 'dot offline';
                    return;
                }
                var d = res.data;
                var st = d.discord_status || 'offline';
                text.textContent = labels[st] || st;
                dot.className = 'dot ' + st;
            })
            .catch(function() {
                text.textContent = 'offline';
                dot.className = 'dot offline';
            });
    }
    update();
    setInterval(update, 15000);
})();

(function() {
    /* avatar das amigas: 1) link manual (data-avatar) 2) lanyard 3) inicial bonita */
    var avatars = document.querySelectorAll('.friend-avatar[data-discord-id]');
    if (!avatars.length) return;

    function inicial(fallback) {
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72">' +
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#232328"/><stop offset="1" stop-color="#141418"/>' +
            '</linearGradient></defs>' +
            '<rect width="72" height="72" rx="36" fill="url(#g)"/>' +
            '<text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" ' +
            'fill="#c9a86a" font-family="Inter, sans-serif" font-size="26" font-weight="600">' +
            fallback + '</text></svg>'
        );
    }

    function porLanyard(img, id) {
        fetch('https://api.lanyard.rest/v1/users/' + id)
            .then(function(r) { return r.json(); })
            .then(function(res) {
                if (!res.success) return;
                var u = res.data.discord_user;
                if (!u || !u.avatar) return;
                var ext = u.avatar.startsWith('a_') ? 'gif' : 'png';
                img.src = 'https://cdn.discordapp.com/avatars/' + id + '/' + u.avatar + '.' + ext + '?size=128';
            })
            .catch(function() {});
    }

    avatars.forEach(function(img) {
        var id = img.getAttribute('data-discord-id');
        var fallback = img.getAttribute('data-fallback') || '?';
        var manual = img.getAttribute('data-avatar');

        img.src = inicial(fallback);
        if (manual) {
            img.src = manual;
            img.onerror = function() { porLanyard(img, id); };
        } else {
            porLanyard(img, id);
        }
    });
})();

(function() {
    /* contador de visitas: abacus.jasoncameron.dev (CORS liberado) + um gif por digito.
       /hit/ conta uma vez por aba; /get/ so le, para nao inflar o numero. */
    var API         = 'https://abacus.jasoncameron.dev';
    var NAMESPACE   = 'ythayla.vercel.app';
    var CHAVE       = 'visitas-v3';   /* chave nova = contador comeca zerado */
    var DIGITO_PATH = 'source/views/';
    var SESSION_KEY = 'ythay-contou';

    var countEl  = document.getElementById('wv-count');
    var chibisEl = document.getElementById('wv-chibis');
    if (!chibisEl) return;

    var mostrando = null;

    function deveContar() {
        try {
            if (sessionStorage.getItem(SESSION_KEY)) return false;
            sessionStorage.setItem(SESSION_KEY, '1');
            return true;
        } catch (e) {
            return true;   /* storage bloqueado (modo privado): cada carregamento conta */
        }
    }

    function criaDigito(digito) {
        var img = document.createElement('img');
        img.src = DIGITO_PATH + digito + '.gif';
        img.alt = digito;
        img.dataset.digito = digito;
        img.className = 'pop';
        return img;
    }

    function trocaDigito(img, digito) {
        if (img.dataset.digito === digito) return;
        img.dataset.digito = digito;
        img.src = DIGITO_PATH + digito + '.gif';
        img.alt = digito;
        img.classList.remove('pop');
        void img.offsetWidth;          /* reinicia a animacao */
        img.classList.add('pop');
    }

    function renderNumber(valor) {
        var texto = String(valor);
        if (texto === mostrando) return;
        mostrando = texto;

        var atual = chibisEl.children;
        if (atual.length !== texto.length) {
            while (chibisEl.firstChild) chibisEl.removeChild(chibisEl.firstChild);
            for (var i = 0; i < texto.length; i++) {
                chibisEl.appendChild(criaDigito(texto.charAt(i)));
            }
        } else {
            for (var j = 0; j < texto.length; j++) {
                trocaDigito(atual[j], texto.charAt(j));
            }
        }

        if (countEl) {
            countEl.textContent = texto;
            countEl.hidden = true;     /* os gifs passam a ser o contador visivel */
        }
        chibisEl.setAttribute('aria-label', texto + ' views');
    }

    function falhou() {
        if (!countEl) return;
        countEl.textContent = '\u2014';   /* travessao */
        countEl.hidden = false;
    }

    function pede(rota) {
        return fetch(API + '/' + rota + '/' + NAMESPACE + '/' + CHAVE, { cache: 'no-store' })
            .then(function(r) {
                if (!r.ok) throw new Error('http ' + r.status);
                return r.json();
            })
            .then(function(d) {
                if (d && typeof d.value === 'number') return d.value;
                throw new Error('resposta sem valor');
            });
    }

    function soLe() {
        return pede('get').catch(function() {
            /* 404 = o contador ainda nao existe: cria ja contando essa visita */
            return pede('hit');
        });
    }

    (deveContar() ? pede('hit') : soLe())
        .then(function(valor) {
            if (valor === null) falhou(); else renderNumber(valor);
        })
        .catch(function() {
            soLe().then(function(valor) {
                if (valor === null) falhou(); else renderNumber(valor);
            });
        });

    setInterval(function() {
        soLe().then(function(valor) {
            if (valor !== null) renderNumber(valor);
        });
    }, 60000);
})();

(function() {
    var LASTFM_USER = 'ythayla';
    var LASTFM_KEY = '4b3809d023a1908d38f0443164318b4e';

    var cover = document.getElementById('ws-cover');
    var songEl = document.getElementById('ws-song');
    var artistEl = document.getElementById('ws-artist');
    if (!songEl) return;

    function update() {
        var url = 'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks' +
                  '&user=' + LASTFM_USER +
                  '&api_key=' + LASTFM_KEY +
                  '&format=json&limit=1';

        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var tracks = data.recenttracks && data.recenttracks.track;
                if (!tracks || !tracks.length) {
                    songEl.textContent = 'nada tocando';
                    artistEl.textContent = 'silêncio por aqui';
                    return;
                }
                var t = tracks[0];
                var isNowPlaying = t['@attr'] && t['@attr'].nowplaying === 'true';

                songEl.textContent = t.name || '—';
                artistEl.textContent = (t.artist && (t.artist['#text'] || t.artist.name)) || '—';

                var img = null;
                if (t.image && t.image.length) {
                    var last = t.image[t.image.length - 1];
                    img = last['#text'] || '';
                }
                if (img) {
                    cover.style.backgroundImage = 'url(' + img + ')';
                    cover.style.animationPlayState = isNowPlaying ? 'running' : 'paused';
                }
            })
            .catch(function() {
                songEl.textContent = 'erro ao carregar';
                artistEl.textContent = 'last.fm';
            });
    }
    update();
    setInterval(update, 30000);
})();

(function() {
    /* galeria "recent plays": ultimas musicas do last.fm + previa de 30s via iTunes */
    var USER = 'ythayla';
    var KEY  = '4b3809d023a1908d38f0443164318b4e';
    var MAX  = 12;

    var galEl = document.getElementById('gal');
    if (!galEl) return;

    var secao     = document.getElementById('musica');
    var palco     = document.querySelector('.gal-palco');
    var btTocar   = document.getElementById('gal-tocar');
    var icone     = document.getElementById('gal-icone');
    var audio     = document.getElementById('gal-audio');
    var elTempo   = document.getElementById('gal-tempo-atual');
    var barra     = document.getElementById('gal-barra');
    var preenche  = document.getElementById('gal-preenche');
    var elMusica  = document.getElementById('gal-musica');
    var elArtista = document.getElementById('gal-artista');

    var faixas  = [];
    var atual   = 0;
    var previas = {};      /* cache: "artista titulo" -> url da previa */
    var pedido  = null;

    function mmss(seg) {
        if (!isFinite(seg) || seg < 0) seg = 0;
        var m = Math.floor(seg / 60);
        var s = Math.floor(seg % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function quando(uts) {
        if (!uts) return 'tocando agora';
        var dif = Math.floor(Date.now() / 1000) - uts;
        if (dif < 60) return 'agora mesmo';
        var m = Math.floor(dif / 60);
        if (m < 60) return m + 'min atrás';
        var h = Math.floor(m / 60);
        if (h < 24) return h + 'h atrás';
        return Math.floor(h / 24) + 'd atrás';
    }

    function chaveDe(f) {
        return (f.artista + ' ' + f.nome).toLowerCase();
    }

    function pinta(base) {
        /* transformacoes calculadas ao vivo: aceita indice fracionario durante o arrasto */
        var f = (typeof base === 'number') ? base : atual;
        var n = faixas.length;
        var itens = galEl.children;
        for (var i = 0; i < itens.length; i++) {
            var d = i - f;
            if (n > 4) {
                if (d > n / 2) d -= n;
                if (d < -n / 2) d += n;
            }
            var ad = Math.abs(d);
            var el = itens[i];
            if (ad > 2.4) {
                el.style.opacity = '0';
                el.style.zIndex = '1';
                el.style.pointerEvents = 'none';
                continue;
            }
            el.style.transform = 'translateX(' + (d * 88).toFixed(1) + 'px) rotateY(' +
                                 (-d * 44).toFixed(1) + 'deg) scale(' + (1.15 - 0.33 * ad).toFixed(3) + ')';
            el.style.opacity = Math.max(0.07, 1 - 0.45 * ad).toFixed(3);
            el.style.zIndex = String(10 - Math.round(ad * 2));
            el.style.pointerEvents = 'auto';
        }
    }

    function legenda() {
        var f = faixas[atual];
        if (!f) return;
        elMusica.textContent  = f.nome;
        elArtista.textContent = f.artista + ' · ' + f.quando;
    }

    function parar() {
        audio.pause();
        try { audio.currentTime = 0; } catch (e) {}
        preenche.style.width = '0%';
        elTempo.textContent  = '0:00';
        btTocar.classList.remove('tocando');
        icone.className = 'fas fa-play';
    }

    function carregaPrevia() {
        var f = faixas[atual];
        if (!f) return;
        var k = chaveDe(f);

        if (previas[k]) {
            if (audio.getAttribute('src') !== previas[k]) audio.src = previas[k];
            return;
        }

        if (pedido) { try { pedido.abort(); } catch (e) {} }
        var termo = encodeURIComponent(f.artista + ' ' + f.nome);
        pedido = fetch('https://itunes.apple.com/search?term=' + termo +
                       '&media=music&entity=song&limit=1', { cache: 'force-cache' })
            .then(function(r) { return r.json(); })
            .then(function(d) {
                var t = d.results && d.results[0];
                if (!t || !t.previewUrl) return;
                previas[k] = t.previewUrl;
                if (faixas[atual] && chaveDe(faixas[atual]) === k) audio.src = t.previewUrl;
            })
            .catch(function() {});
    }

    function troca(indice) {
        if (!faixas.length) return;
        var n = indice;
        if (n < 0) n = faixas.length - 1;
        if (n >= faixas.length) n = 0;
        atual = n;
        parar();
        pinta();
        legenda();
        carregaPrevia();
    }

    function alterna() {
        if (!audio.getAttribute('src')) return;
        if (audio.paused) audio.play().catch(function() {});
        else audio.pause();
    }
    function monta(lista) {
        faixas = lista;
        galEl.innerHTML = '';
        if (!lista.length) {
            var v = document.createElement('div');
            v.className = 'gal-vazio';
            v.textContent = 'nada por aqui ainda';
            galEl.appendChild(v);
            return;
        }
        lista.forEach(function(f, i) {
            var item = document.createElement('div');
            item.className = 'gal-item';
            item.title = f.artista + ' - ' + f.nome;
            var img = document.createElement('img');
            img.className = 'capa';
            img.src = f.img;
            img.alt = f.nome;
            item.appendChild(img);
            var espelho = document.createElement('img');
            espelho.className = 'gal-espelho';
            espelho.src = f.img;
            espelho.alt = '';
            item.appendChild(espelho);
            item.addEventListener('click', function() {
                if (i === atual) alterna(); else troca(i);
            });
            galEl.appendChild(item);
        });
        atual = 0;
        pinta();
        legenda();
        carregaPrevia();
    }

    btTocar.addEventListener('click', alterna);

    audio.addEventListener('play', function() {
        btTocar.classList.add('tocando');
        icone.className = 'fas fa-pause';
    });
    audio.addEventListener('pause', function() {
        btTocar.classList.remove('tocando');
        icone.className = 'fas fa-play';
    });
    audio.addEventListener('timeupdate', function() {
        var d = audio.duration || 30;
        preenche.style.width = Math.min(100, (audio.currentTime / d) * 100) + '%';
        elTempo.textContent = mmss(audio.currentTime);
    });
    audio.addEventListener('ended', parar);

    barra.addEventListener('click', function(e) {
        if (!audio.duration) return;
        var r = barra.getBoundingClientRect();
        audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });

    document.addEventListener('keydown', function(e) {
        if (!secao || !secao.classList.contains('active')) return;
        var k = e.key.toLowerCase();
        if (e.key === 'ArrowLeft'  || k === 'a') troca(atual - 1);
        if (e.key === 'ArrowRight' || k === 'd') troca(atual + 1);
        if (e.key === ' ') { e.preventDefault(); alterna(); }
    });

    /* arrastar com o mouse ou o dedo: as capas seguem a mao.
       clique continua igual: toque curto = clica, movimento = arrasta */
    var arrastando = false;
    var xIni = 0;
    var frac = 0;
    var arrasteFim = 0;

    function comeca(e) {
        arrastando = true;
        xIni = e.clientX;
        frac = atual;
        galEl.classList.add('arrastando');
    }
    function move(e) {
        if (!arrastando) return;
        frac = atual - (e.clientX - xIni) / 88;
        if (Math.abs(e.clientX - xIni) > 6) galEl.classList.add('moveu');
        pinta(frac);
    }
    function solta() {
        if (!arrastando) return;
        arrastando = false;
        galEl.classList.remove('arrastando');
        var foiArrastao = galEl.classList.contains('moveu');
        galEl.classList.remove('moveu');
        if (foiArrastao) arrasteFim = Date.now();
        var n = Math.round(frac);
        if (n < 0) n = faixas.length - 1;
        if (n >= faixas.length) n = 0;
        if (!foiArrastao) { pinta(); return; }   /* clique puro: devolve exato e o click decide */
        if (n === atual) { pinta(); return; }
        troca(n);
    }
    if (palco) {
        palco.addEventListener('pointerdown', comeca);
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', solta);
        document.addEventListener('pointercancel', solta);
        galEl.addEventListener('dragstart', function(e) { e.preventDefault(); });
    }

    /* clique que vem logo depois de um arraste: ignora (click-after-drag) */
    galEl.addEventListener('click', function(e) {
        if (Date.now() - arrasteFim < 600) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);

    fetch('https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=' + USER +
          '&api_key=' + KEY + '&format=json&limit=' + MAX)
        .then(function(r) { return r.json(); })
        .then(function(d) {
            var bruto = (d.recenttracks && d.recenttracks.track) || [];
            monta(bruto.map(function(t) {
                var img = '';
                var imgs = t.image || [];
                for (var i = imgs.length - 1; i >= 0; i--) {
                    if (imgs[i] && imgs[i]['#text']) { img = imgs[i]['#text']; break; }
                }
                return {
                    nome: t.name || 'desconhecido',
                    artista: (t.artist && (t.artist['#text'] || t.artist.name)) || 'desconhecido',
                    img: img,
                    quando: t.date ? quando(parseInt(t.date.uts, 10)) : 'tocando agora'
                };
            }));
        })
        .catch(function() {
            galEl.innerHTML = '';
            var v = document.createElement('div');
            v.className = 'gal-vazio';
            v.textContent = 'nao consegui carregar o last.fm';
            galEl.appendChild(v);
        });
})();

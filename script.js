function startExperience() {
    var overlay = document.getElementById('overlay');
    var content = document.getElementById('content');
    var toggle = document.getElementById('view-toggle');
    var views = document.getElementById('widget-views');
    var spotify = document.getElementById('widget-spotify');

    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(function() { overlay.style.display = 'none'; }, 500);

    content.style.display = 'block';
    setTimeout(function() {
        content.style.opacity = '1';
        if (views) views.classList.add('active');
        if (spotify) spotify.classList.add('active');
    }, 80);

    if (toggle) toggle.classList.add('active');
}

(function() {
    var tabs = document.querySelectorAll('.tab');
    var sections = document.querySelectorAll('.content-section');
    if (!tabs.length) return;

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var target = tab.getAttribute('data-page');
            tabs.forEach(function(t) { t.classList.remove('active'); });
            sections.forEach(function(s) { s.classList.remove('active'); });
            tab.classList.add('active');
            var el = document.getElementById(target);
            if (el) el.classList.add('active');
            history.replaceState(null, '', '#' + target);
        });
    });

    var hash = window.location.hash.replace('#', '');
    if (hash) {
        var t = document.querySelector('.tab[data-page="' + hash + '"]');
        if (t) t.click();
    }
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
    var avatars = document.querySelectorAll('.friend-avatar[data-discord-id]');
    if (!avatars.length) return;

    avatars.forEach(function(img) {
        var id = img.getAttribute('data-discord-id');
        var fallback = img.getAttribute('data-fallback') || '?';

        img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">' +
            '<rect width="36" height="36" fill="rgba(255,255,255,0.05)" rx="18"/>' +
            '<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" ' +
            'fill="#aaa" font-family="Inter, sans-serif" font-size="14" font-weight="600">' +
            fallback + '</text></svg>'
        );

        fetch('https://api.lanyard.rest/v1/users/' + id)
            .then(function(r) { return r.json(); })
            .then(function(res) {
                if (!res.success) return;
                var u = res.data.discord_user;
                if (!u || !u.avatar) return;
                var ext = u.avatar.startsWith('a_') ? 'gif' : 'png';
                img.src = 'https://cdn.discordapp.com/avatars/' + u.id + '/' + u.avatar + '.' + ext + '?size=128';
            })
            .catch(function() {});
    });
})();

(function() {
    var el = document.getElementById('wv-count');
    if (!el) return;

    function update() {
        fetch('https://hits.sh/ythayla.vercel.app.json')
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d && typeof d.value !== 'undefined') {
                    el.textContent = d.value;
                } else if (d && d.count) {
                    el.textContent = d.count;
                }
            })
            .catch(function() {
                el.textContent = '—';
            });
    }
    update();
    setInterval(update, 60000);
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

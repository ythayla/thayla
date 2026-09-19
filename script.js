/* ============ OVERLAY ============ */
function startExperience() {
    var overlay = document.getElementById('overlay');
    var content = document.getElementById('content');
    var toggle = document.getElementById('view-toggle');

    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(function() { overlay.style.display = 'none'; }, 500);

    content.style.display = 'block';
    setTimeout(function() { content.style.opacity = '1'; }, 80);

    if (toggle) toggle.classList.add('active');
}

/* ============ ABAS ============ */
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

/* ============ ESCONDER UI (Tab) ============ */
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

/* ============ COPIAR NICK ============ */
function copyName(text) {
    navigator.clipboard.writeText(text);
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 1600);
}

/* ============ LANYARD ============ */
(function() {
    var DISCORD_ID = '947175002007015484';
    var dot = document.getElementById('status-dot');
    var text = document.getElementById('status-text');
    var nowPlaying = document.getElementById('now-playing');
    var npCover = document.getElementById('np-cover');
    var npSong = document.getElementById('np-song');
    var npArtist = document.getElementById('np-artist');
    if (!text) return;

    var labels = { online: 'online', idle: 'ausente', dnd: 'ocupada', offline: 'offline' };

    function update() {
        fetch('https://api.lanyard.rest/v1/users/' + DISCORD_ID)
            .then(function(r) { return r.json(); })
            .then(function(res) {
                if (!res.success) {
                    text.textContent = 'offline';
                    dot.className = 'dot offline';
                    if (nowPlaying) nowPlaying.style.display = 'none';
                    return;
                }
                var d = res.data;
                var st = d.discord_status || 'offline';
                text.textContent = labels[st] || st;
                dot.className = 'dot ' + st;

                if (d.listening_to_spotify && d.spotify) {
                    nowPlaying.style.display = 'flex';
                    npCover.style.backgroundImage = 'url(' + d.spotify.album_art_url + ')';
                    npSong.textContent = d.spotify.song;
                    npArtist.textContent = d.spotify.artist;
                } else {
                    nowPlaying.style.display = 'none';
                }
            })
            .catch(function() {
                text.textContent = 'offline';
                dot.className = 'dot offline';
            });
    }
    update();
    setInterval(update, 15000);
})();

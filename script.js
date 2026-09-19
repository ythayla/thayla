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
document.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    if (e.repeat) return;
    uiHidden = !uiHidden;
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
});
document.getElementById('view-toggle').addEventListener('click', function() {
    uiHidden = !uiHidden;
    var content = document.getElementById('content');
    var icon = document.getElementById('view-icon');
    if (uiHidden) {
        content.style.opacity = '0';
        content.style.pointerEvents = 'none';
        if (icon) icon.className = 'fas fa-eye-slash';
    } else {
        content.style.opacity = '1';
        content.style.pointerEvents = 'auto';
        if (icon) icon.className = 'fas fa-eye';
    }
});

/* ============ COELHO ============ */
(function() {
    var bunny = document.getElementById('bunny');
    if (!bunny) return;

    var x = 50, y = window.innerHeight - 60;
    var mx = x, my = y;
    var jump = 0, facingRight = false;
    var isCarrot = false, canEat = false, moved = false;

    var bunnyCursor = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size:24px'><text y='24'>🐇</text></svg>";

    window.addEventListener('mousemove', function(e) {
        mx = e.clientX;
        my = e.clientY;
        if (!moved) { moved = true; canEat = true; }
    });
    window.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) {
            mx = e.touches[0].clientX;
            my = e.touches[0].clientY;
            if (!moved) { moved = true; canEat = true; }
        }
    }, { passive: true });

    function swapRoles() {
        canEat = false;
        isCarrot = !isCarrot;
        if (isCarrot) {
            document.body.style.cursor = "url('" + bunnyCursor + "') 4 4, auto";
            bunny.textContent = '🥕';
        } else {
            document.body.style.cursor = 'url("source/cursor_trans.png") 16 16, auto';
            bunny.textContent = '🐇';
        }
        setTimeout(function() { canEat = true; }, 1200);
    }

    function tick() {
        var dx = mx - x;
        var dy = my - y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (Math.abs(dx) > 2) facingRight = dx > 0;
        var jumpY = 0, squash = 1;

        if (dist < 14 && canEat) swapRoles();

        if (dist > 10) {
            x += (dx / dist) * 0.35;
            y += (dy / dist) * 0.35;
            jump += 0.12;
            var jp = Math.sin(jump);
            jumpY = -Math.max(0, jp) * 10;
            squash = 1 + jp * 0.12;
        }

        var sx = (facingRight && !isCarrot) ? -1 : 1;
        bunny.style.transform = "translate(" + (x - 14) + "px," + (y - 20 + jumpY) + "px) scaleX(" + sx + ") scaleY(" + squash + ")";
        requestAnimationFrame(tick);
    }
    tick();
})();

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

/* ============================================================
   1. VÍDEO DE FUNDO + OVERLAY
   ============================================================ */
var video = document.getElementById('bg-video');
if (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.play().catch(function(){});
}

function startExperience() {
    var overlay = document.getElementById('overlay');
    var content = document.getElementById('content');
    var volumeControl = document.getElementById('volume-control');
    var viewToggle = document.getElementById('view-toggle');

    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    setTimeout(function() { overlay.style.display = 'none'; }, 400);

    content.style.display = 'flex';
    setTimeout(function() { content.style.opacity = '1'; }, 50);

    volumeControl.classList.add('ativo');
    viewToggle.classList.add('ativo');

    if (video) {
        video.muted = false;
        video.volume = 1.0;
        video.play().catch(function(e) { console.log("Aviso de vídeo:", e); });
    }
}

/* ============================================================
   2. CONTROLE DE VOLUME
   ============================================================ */
var volumeSlider = document.getElementById('volume-slider');
var volumeIcon = document.getElementById('volume-icon');
var ultimoVolume = 1.0;

if (volumeSlider && volumeIcon) {
    volumeSlider.addEventListener('input', function() {
        if (!video) return;
        var novoVolume = parseFloat(this.value);
        video.muted = false;
        video.volume = novoVolume;
        if (novoVolume > 0) ultimoVolume = novoVolume;
        atualizarIcone(novoVolume);
    });

    volumeIcon.addEventListener('click', function() {
        if (!video) return;
        if (video.volume > 0) {
            ultimoVolume = video.volume;
            video.volume = 0;
            volumeSlider.value = 0;
            atualizarIcone(0);
        } else {
            var v = ultimoVolume > 0 ? ultimoVolume : 1.0;
            video.muted = false;
            video.volume = v;
            volumeSlider.value = v;
            atualizarIcone(v);
        }
    });
}

function atualizarIcone(valor) {
    if (!volumeIcon) return;
    if (valor == 0) volumeIcon.className = 'fas fa-volume-mute';
    else if (valor < 0.5) volumeIcon.className = 'fas fa-volume-down';
    else volumeIcon.className = 'fas fa-volume-up';
}

/* ============================================================
   3. INCLINAÇÃO 3D DO CARD
   ============================================================ */
function aplicarInclinacao(e) {
    var content = document.getElementById("content");
    if (!content || content.style.display !== 'flex') return;

    var rect = content.getBoundingClientRect();
    var centroX = rect.left + rect.width / 2;
    var centroY = rect.top + rect.height / 2;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var distanciaX = clientX - centroX;
    var distanciaY = clientY - centroY;
    var inclinacaoX = distanciaY / 25;
    var inclinacaoY = -(distanciaX / 25);
    content.style.transform = `perspective(1000px) rotateX(${inclinacaoX}deg) rotateY(${inclinacaoY}deg)`;
}
document.addEventListener("mousemove", aplicarInclinacao);

function removerInclinacao() {
    var content = document.getElementById("content");
    if (content && content.style.display === 'flex') {
        content.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    }
}
document.addEventListener("mouseleave", removerInclinacao);

/* ============================================================
   4. ESCONDER/MOSTRAR UI (Tab ou olhinho)
   ============================================================ */
var isUIHidden = false;
function atualizarVisualizacao() {
    var content = document.getElementById('content');
    var volumeControl = document.getElementById('volume-control');
    var viewIcon = document.getElementById('view-icon');
    var viewToggle = document.getElementById('view-toggle');
    var overlay = document.getElementById('overlay');

    if (overlay && overlay.style.display !== 'none') return;

    if (isUIHidden) {
        if (content) { content.style.opacity = '0'; content.style.pointerEvents = 'none'; }
        if (volumeControl) volumeControl.classList.remove('ativo');
        if (viewToggle) viewToggle.classList.add('ativo');
        if (viewIcon) viewIcon.className = 'fas fa-eye-slash';
    } else {
        if (content) { content.style.opacity = '1'; content.style.pointerEvents = 'auto'; }
        if (volumeControl) volumeControl.classList.add('ativo');
        if (viewToggle) viewToggle.classList.add('ativo');
        if (viewIcon) viewIcon.className = 'fas fa-eye';
    }
}
var viewToggleEl = document.getElementById('view-toggle');
if (viewToggleEl) {
    viewToggleEl.addEventListener('click', function() {
        isUIHidden = !isUIHidden;
        atualizarVisualizacao();
    });
}
document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        if (e.repeat) return;
        isUIHidden = !isUIHidden;
        atualizarVisualizacao();
    }
});

/* ============================================================
   5. COELHO QUE SEGUE O MOUSE
   ============================================================ */
(function() {
    const bunny = document.getElementById('bunny');
    if (!bunny) return;

    let currentX = 50;
    let currentY = window.innerHeight - 60;
    let mouseX = currentX;
    let mouseY = currentY;
    let jumpPhase = 0;
    let facingRight = false;
    let isSwapped = false;
    let canEat = false;
    let hasMoved = false;

    const bunnyCursorSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" style="font-size:24px"><text y="24">🐇</text></svg>`;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX; mouseY = e.clientY;
        if (!hasMoved) { hasMoved = true; canEat = true; }
    });
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
            if (!hasMoved) { hasMoved = true; canEat = true; }
        }
    }, { passive: true });

    function triggerEatEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const spark = document.createElement('div');
            spark.className = 'firework-spark';
            spark.style.width = '4px'; spark.style.height = '4px';
            document.body.appendChild(spark);
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            let vx = Math.cos(angle) * speed;
            let vy = Math.sin(angle) * speed;
            let posX = x, posY = y, life = 0;
            function anim() {
                life++;
                posX += vx; posY += vy;
                spark.style.left = `${posX}px`;
                spark.style.top = `${posY}px`;
                spark.style.opacity = `${1 - life / 20}`;
                if (life < 20) requestAnimationFrame(anim);
                else spark.remove();
            }
            anim();
        }
    }

    function swapRoles() {
        canEat = false;
        isSwapped = !isSwapped;
        triggerEatEffect(currentX, currentY);
        if (isSwapped) {
            document.body.style.cursor = `url('${bunnyCursorSVG}') 4 4, auto`;
            bunny.textContent = '🥕';
        } else {
            document.body.style.cursor = 'url("source/cursor_trans.png") 16 16, auto';
            bunny.textContent = '🐇';
        }
        setTimeout(() => { canEat = true; }, 1200);
    }

    function animate() {
        const dx = mouseX - currentX;
        const dy = mouseY - currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (Math.abs(dx) > 2) facingRight = dx > 0;

        let jumpOffsetY = 0;
        let squash = 1;

        if (distance < 14 && canEat) swapRoles();

        if (distance > 10) {
            const speed = 0.3;
            currentX += (dx / distance) * speed;
            currentY += (dy / distance) * speed;
            jumpPhase += 0.12;
            const jumpProgress = Math.sin(jumpPhase);
            jumpOffsetY = -Math.max(0, jumpProgress) * 12;
            squash = 1 + jumpProgress * 0.15;
        }

        const scaleX = (facingRight && !isSwapped) ? -1 : 1;
        bunny.style.transform = `translate(${currentX - 14}px, ${currentY - 20 + jumpOffsetY}px) scaleX(${scaleX}) scaleY(${squash})`;
        requestAnimationFrame(animate);
    }
    animate();
})();

/* ============================================================
   6. FOGOS DE ARTIFÍCIO NO USERNAME
   ============================================================ */
(function() {
    const usernameEl = document.querySelector('.username');
    if (!usernameEl) return;

    function spawnMiniFirework(x, y) {
        if (document.hidden) return;
        const particleCount = 10 + Math.floor(Math.random() * 8);
        for (let i = 0; i < particleCount; i++) {
            const spark = document.createElement('div');
            spark.className = 'firework-spark';
            const size = Math.random() * 2.5 + 1.5;
            spark.style.width = `${size}px`;
            spark.style.height = `${size}px`;
            document.body.appendChild(spark);
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2.5 + 1;
            let vx = Math.cos(angle) * speed;
            let vy = Math.sin(angle) * speed;
            let posX = x, posY = y, life = 0;
            const maxLife = 35 + Math.random() * 20;
            function animateSpark() {
                if (document.hidden) { spark.remove(); return; }
                life++;
                posX += vx; posY += vy;
                vy += 0.04; vx *= 0.96; vy *= 0.96;
                const opacity = 1 - (life / maxLife);
                spark.style.left = `${posX}px`;
                spark.style.top = `${posY}px`;
                spark.style.opacity = opacity;
                spark.style.transform = `scale(${opacity})`;
                if (life < maxLife) requestAnimationFrame(animateSpark);
                else spark.remove();
            }
            requestAnimationFrame(animateSpark);
        }
    }

    function triggerRandomBurst() {
        if (document.hidden || window.getComputedStyle(usernameEl).opacity === "0") {
            setTimeout(triggerRandomBurst, 500);
            return;
        }
        const rect = usernameEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            spawnMiniFirework(
                rect.left + Math.random() * rect.width,
                rect.top + Math.random() * rect.height
            );
        }
        setTimeout(triggerRandomBurst, Math.random() * 600 + 400);
    }
    triggerRandomBurst();
})();

/* ============================================================
   7. CURSOR GLOW
   ============================================================ */
(function() {
    var glow = document.getElementById('cursor-glow');
    if (!glow) return;
    var mouseX = -100, mouseY = -100;
    var glowX = -100, glowY = -100;
    var pararTimeout = null;

    window.addEventListener('mousemove', function(e) {
        mouseX = e.clientX; mouseY = e.clientY;
        glow.classList.add('active');
        clearTimeout(pararTimeout);
        pararTimeout = setTimeout(function() { glow.classList.remove('active'); }, 300);
    }, { passive: true });

    window.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
            glow.classList.add('active');
            clearTimeout(pararTimeout);
            pararTimeout = setTimeout(function() { glow.classList.remove('active'); }, 300);
        }
    }, { passive: true });

    function animar() {
        glowX += (mouseX - glowX) * 0.15;
        glowY += (mouseY - glowY) * 0.15;
        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';
        requestAnimationFrame(animar);
    }
    animar();
})();

/* ============================================================
   8. ABAS (about / friends / contact / extra)
   ============================================================ */
(function() {
    const tabs = document.querySelectorAll('.tab');
    const pages = document.querySelectorAll('.page');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.page;
            tabs.forEach(t => t.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const el = document.getElementById(target);
            if (el) el.classList.add('active');
            history.replaceState(null, '', '#' + target);
        });
    });

    // abre aba correta se tiver hash na URL
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        const tab = document.querySelector(`.tab[data-page="${hash}"]`);
        if (tab) tab.click();
    }
})();

/* ============================================================
   9. COPIAR NICK MINECRAFT
   ============================================================ */
function copyName(name) {
    navigator.clipboard.writeText(name);
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1600);
}

/* ============================================================
   10. LANYARD — STATUS DISCORD + SPOTIFY
   ============================================================ */
(function() {
    const DISCORD_ID = '947175002007015484';
    const statusEl = document.getElementById('discord-status');
    const statusText = statusEl ? statusEl.querySelector('.status-text') : null;
    const nowPlaying = document.getElementById('now-playing');
    const npCover = document.getElementById('np-cover');
    const npSong = document.getElementById('np-song');
    const npArtist = document.getElementById('np-artist');

    if (!statusEl) return;

    const labels = {
        online: 'online',
        idle: 'idle',
        dnd: 'do not disturb',
        offline: 'offline'
    };

    function atualizar() {
        fetch('https://api.lanyard.rest/v1/users/' + DISCORD_ID)
            .then(r => r.json())
            .then(res => {
                if (!res.success) {
                    statusText.textContent = 'offline';
                    statusEl.className = 'status-line offline';
                    if (nowPlaying) nowPlaying.style.display = 'none';
                    return;
                }
                const d = res.data;
                const st = d.discord_status || 'offline';
                statusText.textContent = labels[st] || st;
                statusEl.className = 'status-line ' + st;

                // Spotify
                if (d.listening_to_spotify && d.spotify) {
                    if (nowPlaying) nowPlaying.style.display = 'flex';
                    if (npCover) npCover.style.backgroundImage = `url(${d.spotify.album_art_url})`;
                    if (npSong) npSong.textContent = d.spotify.song;
                    if (npArtist) npArtist.textContent = d.spotify.artist;
                } else {
                    if (nowPlaying) nowPlaying.style.display = 'none';
                }
            })
            .catch(() => {
                statusText.textContent = 'offline';
                statusEl.className = 'status-line offline';
            });
    }

    atualizar();
    setInterval(atualizar, 15000);
})();

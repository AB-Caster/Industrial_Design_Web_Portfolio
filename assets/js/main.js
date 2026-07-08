(() => {
'use strict';

const d = document;
const w = window;
const reduce = w.matchMedia('(prefers-reduced-motion: reduce)');
const $ = (s, r = d) => r.querySelector(s);
const $$ = (s, r = d) => [...r.querySelectorAll(s)];
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const debounce = (fn, ms = 150) => {
    let id;
    return (...args) => {
        clearTimeout(id);
        id = setTimeout(() => fn(...args), ms);
    };
};
const rafThrottle = fn => {
    let frame = 0;
    return (...args) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            fn(...args);
        });
    };
};
const idle = fn => 'requestIdleCallback' in w
    ? requestIdleCallback(fn, { timeout: 1200 })
    : setTimeout(fn, 1);

/* NAVIGATION */
function initNavigation() {
    const nav = $('.nav');
    if (!nav) return;

    const update = rafThrottle(() =>
        nav.classList.toggle('nav--scrolled', w.scrollY > 40)
    );

    update();
    w.addEventListener('scroll', update, { passive: true });

    const mobileQuery = w.matchMedia('(max-width: 768px)');
    const desktopLinks = $('.nav__links', nav);
    let toggle = null;
    let panel = null;

    if (desktopLinks) {
        toggle = d.createElement('button');
        toggle.className = 'nav__toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-label', 'Open navigation');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<span class="nav__toggle-lines" aria-hidden="true"></span>';

        panel = d.createElement('div');
        panel.className = 'nav__mobile-panel';
        panel.setAttribute('aria-hidden', 'true');
        panel.innerHTML = `<ul class="nav__mobile-links">${desktopLinks.innerHTML.replaceAll('nav__link', 'nav__mobile-link')}</ul>`;

        $('.nav__inner', nav)?.append(toggle);
        nav.append(panel);

        const closeMenu = () => {
            nav.classList.remove('nav--menu-open');
            d.body.classList.remove('nav-menu-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Open navigation');
            panel.setAttribute('aria-hidden', 'true');
        };

        toggle.addEventListener('click', () => {
            const opening = !nav.classList.contains('nav--menu-open');
            nav.classList.toggle('nav--menu-open', opening);
            d.body.classList.toggle('nav-menu-open', opening);
            toggle.setAttribute('aria-expanded', String(opening));
            toggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
            panel.setAttribute('aria-hidden', String(!opening));
        });

        panel.addEventListener('click', event => {
            if (event.target.closest('a')) closeMenu();
        });

        d.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeMenu();
        });

        mobileQuery.addEventListener?.('change', event => {
            if (!event.matches) closeMenu();
        });
    }

    d.addEventListener('click', event => {
        const link = event.target.closest('a[href*="#"]');
        if (!link) return;

        let url;
        try { url = new URL(link.href, location.href); }
        catch { return; }

        if (
            url.origin !== location.origin ||
            url.pathname !== location.pathname ||
            !url.hash ||
            url.hash === '#'
        ) return;

        const target = d.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (!target) return;

        event.preventDefault();

        const navHeight = nav.getBoundingClientRect().height;
        const top = target.getBoundingClientRect().top + scrollY - navHeight;

        w.scrollTo({
            top,
            behavior: reduce.matches ? 'auto' : 'smooth'
        });

        history.pushState?.(null, '', url.hash);
    });
}

/* HERO */
function initHero() {
    const video = $('.hero__video');
    if (!video) return;

    const hero = video.closest('.hero');

    const play = () => {
        if (reduce.matches) {
            video.pause();
            return;
        }

        const result = video.play();
        result?.catch?.(() => hero?.classList.add('hero--video-paused'));
    };

    video.addEventListener('error', () => {
        video.pause();
        video.hidden = true;
        hero?.classList.add('hero--video-fallback');
    }, { once: true });

    video.addEventListener('stalled', () =>
        hero?.classList.add('hero--video-stalled')
    );

    video.addEventListener('playing', () =>
        hero?.classList.remove('hero--video-paused', 'hero--video-stalled')
    );

    reduce.addEventListener?.('change', e => e.matches ? video.pause() : play());
    play();
}

/* MARQUEE */
function initMarquee() {
    const marquees = $$('.marquee');
    if (!marquees.length) return;

    marquees.forEach(marquee => {
        const track = $('.marquee__track', marquee);
        if (!track) return;

        const groups = $$('.marquee__group', track);
        if (groups.length < 2) return;

        let groupWidth = 0;
        let offset = 0;
        let lastTime = null;
        let rafId = 0;
        const speed = 40;

        const measure = () => {
            groupWidth = groups[0].getBoundingClientRect().width;
        };

        track.style.animation = 'none';
        track.style.willChange = 'transform';

        const tick = time => {
            if (lastTime === null) lastTime = time;
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            if (!reduce.matches && groupWidth > 0) {
                offset -= speed * dt;
                if (offset <= -groupWidth) offset += groupWidth;
            }

            track.style.transform = `translate3d(${offset}px,0,0)`;
            rafId = requestAnimationFrame(tick);
        };

        measure();
        rafId = requestAnimationFrame(tick);

        w.addEventListener('resize', debounce(measure, 150));
        d.fonts?.ready?.then(measure).catch(() => {});

        reduce.addEventListener?.('change', () => {
            if (reduce.matches) track.style.transform = 'translate3d(0,0,0)';
        });
    });
}

/* HOMEPAGE PROJECT STACK */
function initProjectStack() {
    const stack = $('.stack');
    if (!stack) return;

    const cards = $$('.stack__card', stack);
    if (cards.length < 2) return;

    const projects = stack.closest('.projects');
    const preview = $('.stack-preview', projects || d);
    const previewCategory = $('.stack-preview__category', preview || d);
    const previewTitle = $('.stack-preview__title', preview || d);
    const previewCopy = $('.stack-preview__copy', preview || d);
    const mobileQuery = w.matchMedia('(max-width: 900px)');

    const REST = [
        { x: 0,    y: 0,   z: 0,    ry: -18, sx: .88, sy: .88 },
        { x: 345,  y: -14, z: -75,  ry: -20, sx: .82, sy: .86 },
        { x: 645,  y: -28, z: -150, ry: -22, sx: .75, sy: .81 },
        { x: 900,  y: -42, z: -225, ry: -24, sx: .68, sy: .76 },
        { x: 1115, y: -56, z: -300, ry: -26, sx: .61, sy: .71 }
    ];

    let active = -1;
    let stackWidth = 0;
    let stackHeight = 0;
    let cardWidth = cards[0].offsetWidth || 650;
    let cardHeight = cards[0].offsetHeight || 366;

    stack.tabIndex = 0;
    stack.setAttribute('role', 'region');
    stack.setAttribute('aria-label', 'Selected projects');

    const isMobile = () => mobileQuery.matches;

    const baseFor = index => {
        if (REST[index]) return REST[index];
        const extra = index - REST.length + 1;
        return {
            x: 1115 + extra * 190,
            y: -56 - extra * 14,
            z: -300 - extra * 75,
            ry: -26 - extra * 2,
            sx: Math.max(.46, .61 - extra * .05),
            sy: Math.max(.56, .71 - extra * .05)
        };
    };

    const measure = () => {
        stackWidth = stack.clientWidth || stack.getBoundingClientRect().width || stackWidth;
        stackHeight = stack.clientHeight || stack.getBoundingClientRect().height || stackHeight;
        cardWidth = cards[0].offsetWidth || cardWidth;
        cardHeight = cards[0].offsetHeight || cardHeight;
    };

    const toDesktopTransform = state =>
        `translate3d(${state.x}px,${state.y}px,${state.z}px) ` +
        `rotateY(${state.ry}deg) scale(${state.sx},${state.sy})`;

    const toMobileTransform = state =>
        `translate3d(0,${state.y}px,0) scale(${state.scale})`;

    const projectData = card => ({
        category: $('.stack__category', card)?.textContent.trim() || '',
        title: $('.stack__content h2', card)?.textContent.trim() || '',
        copy: $('.stack__content p', card)?.textContent.trim() || ''
    });

    const updatePreview = index => {
        if (!preview) return;
        const card = cards[index];
        if (!card) return;

        const data = projectData(card);
        if (previewCategory) previewCategory.textContent = data.category;
        if (previewTitle) previewTitle.textContent = data.title;
        if (previewCopy) previewCopy.textContent = data.copy;

        preview.classList.add('stack-preview--active');
    };

    const renderRest = () => {
        active = -1;
        cards.forEach(card => {
            card.classList.remove('stack__card--active');
            card.style.removeProperty('transform');
            card.style.removeProperty('z-index');
            card.style.removeProperty('opacity');
            card.removeAttribute('aria-current');
        });
        preview?.classList.remove('stack-preview--active');
    };

    /* APPROVED DESKTOP STACK MATH — UNCHANGED */
    const layoutFor = activeIndex => {
        const count = cards.length;
        const leftCount = activeIndex;
        const rightCount = count - activeIndex - 1;
        const slots = Math.max(1, leftCount + rightCount);
        const activeScale = .92;
        const activeWidth = cardWidth * activeScale;
        const edgePad = clamp(stackWidth * .04, 60, 80);
        const availableForSteps = Math.max(0, stackWidth - edgePad * 2 - activeWidth);
        const step = Math.max(availableForSteps / slots, 24);
        const activeX = edgePad + leftCount * step;

        const states = cards.map((_, index) => {
            const base = baseFor(index);

            if (index === activeIndex) {
                return { x: activeX, y: base.y, z: 150, ry: 0, sx: activeScale, sy: activeScale };
            }

            if (index < activeIndex) {
                const distance = activeIndex - index;
                const scale = Math.max(.54, activeScale - .14 - (distance - 1) * .035);
                return {
                    x: activeX - distance * step,
                    y: base.y,
                    z: -70 - distance * 55,
                    ry: base.ry,
                    sx: scale,
                    sy: Math.max(.58, scale + .035)
                };
            }

            const distance = index - activeIndex;
            const scale = Math.max(.52, activeScale - .18 - (distance - 1) * .04);
            const width = cardWidth * scale;
            const rightEdge = activeX + activeWidth + distance * step;

            return {
                x: rightEdge - width,
                y: base.y,
                z: -45 - distance * 52,
                ry: base.ry,
                sx: scale,
                sy: Math.max(.56, scale + .045)
            };
        });

        let minLeft = Infinity;
        let maxRight = -Infinity;

        states.forEach((state, index) => {
            const width = index === activeIndex ? activeWidth : cardWidth * state.sx;
            minLeft = Math.min(minLeft, state.x);
            maxRight = Math.max(maxRight, state.x + width);
        });

        const lowerBound = edgePad;
        const upperBound = stackWidth - edgePad - 45;
        let shift = 0;

        if (maxRight > upperBound) {
            shift = -(maxRight - upperBound);
            if (minLeft + shift < lowerBound) shift = lowerBound - minLeft;
        } else if (minLeft < lowerBound) {
            shift = lowerBound - minLeft;
            if (maxRight + shift > upperBound) shift = upperBound - maxRight;
        }

        if (shift) states.forEach(state => state.x += shift);
        return states;
    };

    /*
     * MOBILE STACK:
     * - every card remains physically centred by CSS
     * - project order/layer order remains the deck order
     * - active card alone comes forward and faces the viewport
     * - compact scale reserves the lower screen for the flat preview
     */
    // Flat-facing mobile fan: how much of an adjacent layer peeks out
    // from behind the one in front of it, tapering with distance so a
    // 4-layer-deep fan (best case: first or last project active) stays
    // compact rather than growing linearly.
    const PEEK_RATIOS = [1, .62, .40, .26];
    const PEEK_REACH = PEEK_RATIOS.reduce((sum, ratio) => sum + ratio, 0);

    const peekOffset = (distance, baseStep) => {
        let offset = 0;
        for (let i = 0; i < distance; i += 1) {
            offset += baseStep * PEEK_RATIOS[Math.min(i, PEEK_RATIOS.length - 1)];
        }
        return offset;
    };

    const mobileLayoutFor = activeIndex => {
        const usableHeight = Math.max(240, stackHeight);
        const marginTop = 12;
        const marginBottom = 28;

        /*
         * Mobile card width is controlled by CSS. Do not derive scale from
         * stage height: that was shrinking the wider 94vw card back to the
         * old visual width. Scale is width-led so the card actually fills
         * the viewport as requested.
         */
        const activeScale = clamp((stackWidth * .94) / cardWidth, .90, .96);
        const activeHeight = cardHeight * activeScale;

        /*
         * Solve the vertical fan from the real transformed card heights.
         * The preview owns the space below .stack, so the whole fan is
         * fitted between marginTop and usableHeight - marginBottom.
         */
        const scales = cards.map((_, index) => {
            const distance = Math.abs(index - activeIndex);
            return index === activeIndex
                ? activeScale
                : Math.max(.70, activeScale - distance * .05);
        });

        const maxDistance = Math.max(activeIndex, cards.length - activeIndex - 1);
        const topHalf = cardHeight * scales[0] / 2;
        const bottomHalf = cardHeight * scales[cards.length - 1] / 2;
        const verticalRoom = Math.max(
            0,
            usableHeight - marginTop - marginBottom - topHalf - bottomHalf
        );

        const reach = PEEK_RATIOS
            .slice(0, maxDistance)
            .reduce((sum, ratio) => sum + ratio, 0);

        const baseStep = reach > 0
            ? clamp(verticalRoom / Math.max(PEEK_REACH, reach * 1.35), 8, 42)
            : 0;

        const topReach = peekOffset(activeIndex, baseStep);
        const bottomReach = peekOffset(cards.length - activeIndex - 1, baseStep);

        const minAnchor = marginTop + topReach;
        const maxAnchor = Math.max(
            minAnchor,
            usableHeight - marginBottom - activeHeight - bottomReach
        );

        const travelProgress = activeIndex / Math.max(1, cards.length - 1);
        const activeY = maxAnchor + (minAnchor - maxAnchor) * travelProgress;

        const states = cards.map((_, index) => {
            const distance = Math.abs(index - activeIndex);
            const offset = peekOffset(distance, baseStep);

            return {
                y: index < activeIndex ? activeY - offset : activeY + offset,
                scale: scales[index]
            };
        });

        /*
         * Final transformed-bounds clamp. Unlike the old correction, this
         * uses top-origin transform geometry and applies one bounded shift,
         * so correcting the top cannot push the deck back over the preview.
         */
        const visualTop = state =>
            state.y + (cardHeight * (1 - state.scale)) / 2;
        const visualBottom = state =>
            state.y + (cardHeight * (1 + state.scale)) / 2;

        const minTop = Math.min(...states.map(visualTop));
        const maxBottom = Math.max(...states.map(visualBottom));
        const lowerShift = marginTop - minTop;
        const upperShift = usableHeight - marginBottom - maxBottom;
        const shift = clamp(0, Math.min(0, lowerShift), Math.max(0, upperShift));

        if (shift) {
            states.forEach(state => { state.y += shift; });
        }

        return states;
    };

    const renderActive = () => {
        if (active < 0) {
            renderRest();
            return;
        }

        const mobile = isMobile();
        const states = mobile ? mobileLayoutFor(active) : layoutFor(active);

        cards.forEach((card, index) => {
            const focused = index === active;
            const distance = Math.abs(index - active);

            card.classList.toggle('stack__card--active', focused);
            card.style.transform = mobile
                ? toMobileTransform(states[index])
                : toDesktopTransform(states[index]);
            card.style.opacity = '1';

            card.style.zIndex = mobile
                ? (focused ? '30' : String(Math.max(1, 20 - distance * 4)))
                : (focused ? '20' : String(Math.max(1, 10 - distance)));

            card.setAttribute('aria-current', focused ? 'true' : 'false');
        });

        if (mobile) updatePreview(active);
    };

    const activate = index => {
        const next = clamp(index, 0, cards.length - 1);
        if (next === active) return;
        active = next;
        renderActive();
    };

    const reset = () => renderRest();

    cards.forEach((card, index) => {
        card.addEventListener('pointerenter', event => {
            if (isMobile() || event.pointerType === 'touch') return;
            activate(index);
        });

        card.addEventListener('focusin', () => activate(index));
    });

    stack.addEventListener('pointerleave', event => {
        if (isMobile() || event.pointerType === 'touch') return;
        reset();
    });

    stack.addEventListener('focusout', event => {
        if (!stack.contains(event.relatedTarget) && !isMobile()) reset();
    });

    stack.addEventListener('keydown', event => {
        const keys = isMobile()
            ? ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' ']
            : ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '];

        if (!keys.includes(event.key)) return;
        event.preventDefault();

        let next = active < 0 ? 0 : active;

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(0, next - 1);
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(cards.length - 1, next + 1);
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = cards.length - 1;

        if (event.key === 'Enter' || event.key === ' ') {
            $('a', cards[next])?.click();
            return;
        }

        activate(next);
        $('a', cards[next])?.focus({ preventScroll: true });
    });

    const updateMobileFromScroll = rafThrottle(() => {
        if (!isMobile() || !projects) return;

        const sectionTop = projects.offsetTop;
        const travel = Math.max(1, projects.offsetHeight - w.innerHeight);
        const progress = clamp((w.scrollY - sectionTop) / travel, 0, 1);
        const restZone = .08;

        if (progress < restZone) {
            if (active !== -1) reset();
            return;
        }

        const projectProgress = clamp((progress - restZone) / (1 - restZone), 0, 1);
        const next = Math.min(cards.length - 1, Math.floor(projectProgress * cards.length));
        activate(next);
    });

    measure();

    const reflow = () => {
        measure();

        if (isMobile()) {
            updateMobileFromScroll();
        } else if (active >= 0) {
            renderActive();
        } else {
            renderRest();
        }
    };

    // .stack sits in a sticky, grid-driven row (height:100%) whose real
    // size can resolve asynchronously relative to this script running —
    // a ResizeObserver re-measures the moment the browser knows the
    // actual box size (and again on any later change), so a bad
    // first-paint measurement can't silently persist for the session.
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(debounce(reflow, 60)).observe(stack);
    }

    w.addEventListener('scroll', updateMobileFromScroll, { passive: true });

    w.addEventListener('resize', debounce(reflow, 120));

    mobileQuery.addEventListener?.('change', () => {
        measure();
        renderRest();
        if (isMobile()) updateMobileFromScroll();
    });

    renderRest();
    updateMobileFromScroll();
}

/* PROJECT RAIL */
function initProjectRail() {
    const viewports = $$('.project-rail__viewport');
    if (!viewports.length) return;

    viewports.forEach(viewport => {
        const track = $('.project-rail__track', viewport);
        if (!track) return;

        const cards = $$('.project-rail__card', track);
        if (cards.length < 2) return;

        let isPointerDown = false;
        let isDragging = false;
        let startX = 0;
        let startScroll = 0;

        viewport.tabIndex = 0;
        viewport.setAttribute('role', 'region');
        viewport.setAttribute('aria-label', 'Selected work');
        viewport.style.cursor = 'grab';

        const maxScroll = () =>
            Math.max(0, viewport.scrollWidth - viewport.clientWidth);

        viewport.addEventListener('wheel', event => {
            const horizontalIntent =
                Math.abs(event.deltaX) > Math.abs(event.deltaY);

            if (horizontalIntent) return;
            if (!event.deltaY) return;

            const next = clamp(
                viewport.scrollLeft + event.deltaY,
                0,
                maxScroll()
            );

            const atStart = viewport.scrollLeft <= 0;
            const atEnd = viewport.scrollLeft >= maxScroll() - 1;

            if (
                (atStart && event.deltaY < 0) ||
                (atEnd && event.deltaY > 0)
            ) return;

            event.preventDefault();
            viewport.scrollLeft = next;
        }, { passive: false });

        viewport.addEventListener('pointerdown', event => {
            if (
                event.pointerType === 'mouse' &&
                event.button !== 0
            ) return;

            isPointerDown = true;
            isDragging = false;
            startX = event.clientX;
            startScroll = viewport.scrollLeft;
        });

        viewport.addEventListener('pointermove', event => {
            if (!isPointerDown) return;

            const dx = event.clientX - startX;

            if (!isDragging && Math.abs(dx) > 6) {
                isDragging = true;
                viewport.style.cursor = 'grabbing';
            }

            if (!isDragging) return;

            event.preventDefault();

            viewport.scrollLeft = clamp(
                startScroll - dx,
                0,
                maxScroll()
            );
        });

        const endDrag = () => {
            isPointerDown = false;
            viewport.style.cursor = 'grab';

            setTimeout(() => {
                isDragging = false;
            }, 0);
        };

        viewport.addEventListener('pointerup', endDrag);
        viewport.addEventListener('pointercancel', endDrag);

        viewport.addEventListener('pointerleave', () => {
            if (isPointerDown) endDrag();
        });

        w.addEventListener('pointerup', () => {
            if (isPointerDown) endDrag();
        });

        cards.forEach(card => {
            card.addEventListener('click', event => {
                if (isDragging) event.preventDefault();
            });
        });

        viewport.addEventListener('keydown', event => {
            if (
                !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
            ) return;

            event.preventDefault();

            const amount = cards[0].offsetWidth + 24;

            if (event.key === 'ArrowLeft') {
                viewport.scrollBy({
                    left: -amount,
                    behavior: reduce.matches ? 'auto' : 'smooth'
                });
            }

            if (event.key === 'ArrowRight') {
                viewport.scrollBy({
                    left: amount,
                    behavior: reduce.matches ? 'auto' : 'smooth'
                });
            }

            if (event.key === 'Home') {
                viewport.scrollTo({
                    left: 0,
                    behavior: reduce.matches ? 'auto' : 'smooth'
                });
            }

            if (event.key === 'End') {
                viewport.scrollTo({
                    left: maxScroll(),
                    behavior: reduce.matches ? 'auto' : 'smooth'
                });
            }
        });
    });
}

/* MEDIA */
function initMedia() {
    $$('img').forEach(image => {
        if (!image.hasAttribute('loading') && !image.closest('.hero, .project-hero')) {
            image.loading = 'lazy';
        }

        image.decoding = 'async';

        const ready = async () => {
            try {
                await image.decode?.();
            } catch {}

            if (image.naturalWidth > 0) image.classList.add('media--ready');
        };

        const error = () => {
            image.classList.add('media--error');
            image.dataset.mediaError = 'true';
        };

        if (image.complete) {
            image.naturalWidth > 0 ? ready() : error();
        } else {
            image.addEventListener('load', ready, { once: true });
            image.addEventListener('error', error, { once: true });
        }
    });
}

/* SECURITY / CONTACT */
function initSecurity() {
    const email = ['durodolatemidayo', 'gmail.com'].join('@');

    $$('a[href^="mailto:"]').forEach(link => {
        link.href = `mailto:${email}`;

        if (!link.textContent.trim() || /hello@yourdomain\.com/i.test(link.textContent)) {
            link.textContent = email;
        }
    });

    $$('a[target="_blank"]').forEach(link => {
        const rel = new Set(
            (link.getAttribute('rel') || '').split(/\s+/).filter(Boolean)
        );

        rel.add('noopener');
        rel.add('noreferrer');
        link.setAttribute('rel', [...rel].join(' '));
    });

    $$('form').forEach(form => {
        const started = performance.now();
        let score = 0;
        const addScore = () => score = Math.min(score + 1, 5);

        form.addEventListener('pointerdown', addScore, { once: true, passive: true });
        form.addEventListener('keydown', addScore, { once: true });

        form.addEventListener('submit', event => {
            const trap = $(
                '[data-honeypot], input[name="website"], input[name="_gotcha"]',
                form
            );

            const key = `portfolio-form-cooldown:${form.id || form.action || 'default'}`;
            const last = Number(sessionStorage.getItem(key) || 0);

            if (
                (trap && trap.value.trim()) ||
                performance.now() - started < 1200 ||
                score === 0 ||
                Date.now() - last < 10000
            ) {
                event.preventDefault();
                return;
            }

            sessionStorage.setItem(key, String(Date.now()));
        });
    });
}

/* ACCESSIBILITY */
function initAccessibility() {
    d.addEventListener('keydown', event => {
        if (event.key === 'Escape' && d.activeElement !== d.body) {
            d.activeElement?.blur?.();
        }

        if (event.key === 'Tab') {
            d.documentElement.dataset.inputMode = 'keyboard';
        }
    });

    d.addEventListener('pointerdown', () => {
        d.documentElement.dataset.inputMode = 'pointer';
    }, { passive: true });
}

/* PERFORMANCE */
function initPerformance() {
    const sections = $$('section');

    if ('IntersectionObserver' in w && sections.length) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry =>
                entry.target.classList.toggle('is-in-viewport', entry.isIntersecting)
            );
        }, {
            rootMargin: '200px 0px',
            threshold: 0
        });

        sections.forEach(section => observer.observe(section));
    }

    const video = $('.hero__video');
    const hero = $('.hero');

    if (!video || !hero || !('IntersectionObserver' in w)) return;

    const videoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (reduce.matches || !entry.isIntersecting) {
                video.pause();
            } else {
                video.play().catch(() => {});
            }
        });
    }, { threshold: 0.05 });

    videoObserver.observe(hero);
}

/* INITIALISATION */
function init() {
    const run = fn => {
        try {
            fn();
        } catch (error) {
            console.error(`[main.js] ${fn.name} failed:`, error);
        }
    };

    run(initNavigation);
    run(initHero);
    run(initMarquee);
    run(initProjectStack);
    run(initProjectRail);
    run(initSecurity);
    run(initAccessibility);

    idle(() => {
        run(initMedia);
        run(initPerformance);
    });
}

if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
})();

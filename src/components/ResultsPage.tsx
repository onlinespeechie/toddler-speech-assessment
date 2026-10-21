'use client';

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

interface ResultsPageProps {
  submissionResult: {
    scoreStatus: string;
    communicationStage: string;
    id: string;
    email?: string;
    phone?: string;
    childFirstName?: string | null;
  };
  /** Child's age in whole months, worked out from their date of birth in the quiz. */
  childAgeMonths?: number | null;
  onRestart: () => void;
  isQuizCompleted?: boolean;
  step?: string;
  testEventCode?: string;
}

const GUIDE_URL = 'https://onlinespeechie.com/blog/talking-more-in-10-minutes-a-day-heres-what-every-late-talker-parent-should-do/';
const MASTERCLASS_URL = 'https://onlinespeechie.com/talk-more-masterclass/';
const ACTIVITY_LIBRARY_URL = 'https://onlinespeechie.com/activity';
const TERMS_URL = 'https://onlinespeechie.com/terms-conditons-policies/';

type Cta = {
  id: string;
  dataCtaId: string;
  dataCtaName: string;
  ctaType: 'guide' | 'masterclass' | 'library';
  time: string;
  title: string;
  body: string;
  ctaText: string;
  href: string;
  tone: 'teal' | 'purple';
  chips?: string[];
  freeNote?: string;
  /** On narrow screens the CTA cards stack; this one goes to the top. */
  mobileFirst?: boolean;
};

type StatusKey = 'Delayed' | 'At Risk' | 'On Track';

const STATUS_ORDER: StatusKey[] = ['Delayed', 'At Risk', 'On Track'];

const PILL_TONES: Record<StatusKey, { onBg: string; onFg: string; offBg: string; offFg: string; label: string }> = {
  'Delayed': { onBg: 'var(--qr-purple)', onFg: '#fff', offBg: 'var(--qr-purple-l)', offFg: 'var(--qr-purple-deep)', label: 'DELAYED' },
  'At Risk': { onBg: 'var(--qr-yellow)', onFg: 'var(--qr-yellow-ink)', offBg: 'var(--qr-yellow-l)', offFg: 'var(--qr-yellow-ink)', label: 'AT RISK' },
  'On Track': { onBg: 'var(--qr-teal)', onFg: '#fff', offBg: 'var(--qr-teal-l)', offFg: 'var(--qr-teal-deep)', label: 'ON TRACK' },
};

/** The child's name as it should read in each position, with the agreed fallbacks. */
type NameForms = {
  cap: string;        // sentence start: "Henry" / "Your child"
  low: string;        // mid-sentence: "Henry" / "your child"
  capPoss: string;    // "Henry's" / "Your child's"
  lowPoss: string;    // "Henry's" / "your child's"
  lowPossCurly: string;
  littleOne: string;  // the one agreed exception: "Henry" / "your little one"
};

function nameForms(childName: string): NameForms {
  return {
    cap: childName || 'Your child',
    low: childName || 'your child',
    capPoss: childName ? `${childName}'s` : "Your child's",
    lowPoss: childName ? `${childName}'s` : "your child's",
    lowPossCurly: childName ? `${childName}’s` : 'your child’s',
    littleOne: childName || 'your little one',
  };
}

function guideMasterclassCtas(status: 'delayed' | 'atrisk'): Cta[] {
  const label = status === 'delayed' ? 'Delayed' : 'At Risk';
  return [
    {
      id: `cta-guide-${status}`,
      dataCtaId: `${status}_guide`,
      dataCtaName: `Free Guide — ${label}`,
      ctaType: 'guide',
      time: 'GOT 5 MINUTES?',
      title: 'Free guide',
      body: 'The three things that make the biggest difference to a toddler learning to talk at home. An introduction for those who only have a few minutes up their sleeve.',
      ctaText: 'Read the guide',
      href: GUIDE_URL,
      tone: 'teal',
    },
    {
      id: `cta-masterclass-${status}`,
      dataCtaId: `${status}_masterclass`,
      dataCtaName: `Free Masterclass — ${label}`,
      ctaType: 'masterclass',
      time: 'GOT 45 MINUTES?',
      title: 'Free masterclass',
      body: 'The exact method I teach parents to get their toddler talking more at home. What activities to focus on, what words to use, and demonstrations with real children in everyday moments.',
      ctaText: 'Watch the masterclass',
      href: MASTERCLASS_URL,
      tone: 'purple',
    },
  ];
}

const ON_TRACK_CTAS: Cta[] = [
  {
    id: 'cta-library-ontrack',
    dataCtaId: 'ontrack_library',
    dataCtaName: 'Activity Library — On Track',
    ctaType: 'library',
    time: 'FREE TO BROWSE',
    title: 'The activity library',
    body: "Bite-sized activities for any toy and any routine, filtered by what you've got in the house and how much time you have. Every one is built around the words you want your toddler using.",
    ctaText: 'Explore the activity library',
    href: ACTIVITY_LIBRARY_URL,
    tone: 'teal',
    chips: ['bath time', 'bubbles', 'first words', '10 minutes', 'duplo', 'getting dressed'],
    freeNote: 'Plenty are free to watch right now.',
  },
  {
    id: 'cta-masterclass-ontrack',
    dataCtaId: 'ontrack_masterclass',
    dataCtaName: 'Free Masterclass — On Track',
    ctaType: 'masterclass',
    time: 'GOT 45 MINUTES?',
    title: 'Free masterclass',
    body: 'The exact method I teach parents to get their toddler talking more at home. What activities to focus on, what words to use, and demonstrations with real children.',
    ctaText: 'Watch the masterclass',
    href: MASTERCLASS_URL,
    tone: 'purple',
    freeNote: 'I built it for parents whose children are behind, but the method is the same for those trying to get ahead. More words, then words together, whatever stage your child is at.',
    mobileFirst: true,
  },
];

type StatusContent = {
  videoId: string;
  /** Short paragraph under the banner (Delayed / At Risk only). */
  explain?: (n: NameForms, ageMonths: number | null) => string;
  /** The "trust your instincts" paragraphs under the video (Delayed / At Risk only). */
  turns: boolean;
  leads: (n: NameForms, ageMonths: number | null) => string[];
  ctas: Cta[];
};

const STATUS_CONTENT: Record<StatusKey, StatusContent> = {
  'Delayed': {
    videoId: '1224169398',
    explain: (n, age) =>
      `This result is specific to ${n.lowPossCurly} age. It’s scored against normative data for ${age != null ? `${age}-month-olds` : 'children their age'}, which means ${n.littleOne} is behind where we’d expect them to be by now. They’re either not yet saying enough words, or not combining words into phrases often enough.`,
    turns: true,
    leads: (n) => [
      "Remember, around one in five children are identified as being behind with their talking. It isn't uncommon. But what you do from here does matter.",
      `I've been helping families of toddlers learning to talk for almost 20 years, and I've put together the two resources below for parents just like you. Both are free and both are designed for children of ${n.lowPoss} age.`,
    ],
    ctas: guideMasterclassCtas('delayed'),
  },
  'At Risk': {
    videoId: '1224169399',
    explain: (n, age) =>
      `${age != null ? `At ${age} months,` : 'Right now,'} ${n.low} is tracking just under where we’d expect, based on the normative data for their age. Not far enough under to call it a delay, but enough to warrant attention. It might be the number of words they’re using, or how often they’re putting words together. What matters is whether that gap closes or widens over the next few months.`,
    turns: true,
    leads: (n) => [
      "Around one in five children are identified as being behind with their talking. It's not uncommon. And you've caught it at the best possible point, because you're getting ahead of it rather than catching up.",
      `I've been helping families of toddlers learning to talk for almost 20 years, and I've put together the two resources below for parents just like you. Both are free and both are designed for children of ${n.lowPoss} age.`,
    ],
    ctas: guideMasterclassCtas('atrisk'),
  },
  'On Track': {
    videoId: '1224169400',
    turns: false,
    leads: (n, age) => [
      `Here's the part most parents don't get told: early language keeps compounding. The words a toddler has ${age != null ? `at ${age} months` : 'at this age'} feed their chatter at four, their friendships at five, their reading at six, and it carries on from there.`,
      `So keep doing the good work you're obviously already doing, and keep focusing on ${n.lowPoss} talking. Two free ways to do that below.`,
    ],
    ctas: ON_TRACK_CTAS,
  },
};

export default function ResultsPage({
  submissionResult,
  childAgeMonths = null,
  onRestart,
  isQuizCompleted = true,
  step = 'result',
  testEventCode
}: ResultsPageProps) {
  const videoRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    console.log('🔍 [Meta Debug] ResultsPage mounted, step:', step);

    // STRICT GUARD: Must be on the final results step with valid submission data.
    // On Track results are not reported to Meta (pixel Lead + CAPI) so ad optimisation targets Delayed / At Risk only.
    if ((step === 'result' || isQuizCompleted) && submissionResult && submissionResult.scoreStatus !== 'On Track' && typeof window !== 'undefined') {
      // Unique key per submission (uses submission ID, email, or timestamp fallback)
      const leadId = submissionResult?.id || submissionResult?.email || `lead_${Date.now()}`;
      const storageKey = `meta_lead_fired_${leadId}`;

      // Only fire if this specific thank-you completion has NOT been tracked yet
      if (!sessionStorage.getItem(storageKey)) {
        // Lock immediately BEFORE tracking to prevent race conditions
        sessionStorage.setItem(storageKey, 'true');

        // 1. Client-side Meta Pixel call (if available)
        if (window.fbq) {
          console.log('🔍 [Meta Debug] Firing client fbq Lead for ID:', leadId);
          window.fbq('track', 'Lead', {}, { eventID: String(leadId) });
          console.log('✅ Meta Lead tracked successfully on Thank You page:', leadId);
        } else {
          console.warn('⚠️ [Meta Debug] window.fbq not available yet on client');
        }

        // 2. Server-side Meta Conversions API (CAPI) event call (fires independently)
        console.log('🔍 [Meta Debug] Calling /api/meta-lead...');
        fetch('/api/meta-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: String(leadId),
            email: submissionResult?.email,
            phone: submissionResult?.phone,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            testEventCode: testEventCode || undefined,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log('✅ Meta CAPI Lead event sent:', data);
          })
          .catch((err) => {
            console.error('❌ Failed to send Meta CAPI Lead event:', err);
          });
      }
    }
  }, [step, isQuizCompleted, submissionResult, testEventCode]);

  // GA4 virtual page view -- fires once when the results step is reached
  useEffect(() => {
    if ((step === 'result' || isQuizCompleted) && submissionResult && typeof window !== 'undefined') {
      const leadId = submissionResult?.id || submissionResult?.email || `lead_${Date.now()}`;
      const pvKey = `ga4_pageview_fired_${leadId}`;

      if (!sessionStorage.getItem(pvKey)) {
        sessionStorage.setItem(pvKey, 'true');
        const statusSlug = (submissionResult?.scoreStatus || 'unknown').toLowerCase().replace(/\s+/g, '-');
        (window as any).gtag?.('event', 'page_view', {
          page_location: `${window.location.origin}/quiz-results/${statusSlug}`,
          page_path: `/quiz-results/${statusSlug}`,
          page_title: 'Quiz Results',
          result_status: submissionResult?.scoreStatus,
        });
      }
    }
  }, [step, isQuizCompleted, submissionResult]);

  // GA4 scroll depth tracking -- fires once the visitor scrolls 90% down the results page
  useEffect(() => {
    if (!((step === 'result' || isQuizCompleted) && submissionResult && typeof window !== 'undefined')) return;

    const leadId = submissionResult?.id || submissionResult?.email || `lead_${Date.now()}`;
    const scrollKey = `ga4_scroll90_fired_${leadId}`;
    if (sessionStorage.getItem(scrollKey)) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrolledPct = (scrollTop / docHeight) * 100;
      if (scrolledPct >= 90) {
        sessionStorage.setItem(scrollKey, 'true');
        (window as any).gtag?.('event', 'scroll_90', {
          page_location_custom: 'quiz_results',
          result_status: submissionResult?.scoreStatus,
        });
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [step, isQuizCompleted, submissionResult]);

  // GA4 video play/complete tracking for the Vimeo results-explainer embed
  useEffect(() => {
    if (!((step === 'result' || isQuizCompleted) && submissionResult && typeof window !== 'undefined')) return;

    const leadId = submissionResult?.id || submissionResult?.email || `lead_${Date.now()}`;

    const fireVideoEvent = (eventName: 'video_play' | 'video_complete') => {
      const key = `ga4_${eventName}_${leadId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, 'true');
      (window as any).gtag?.('event', eventName, {
        page_location_custom: 'quiz_results',
        result_status: submissionResult?.scoreStatus,
      });
    };

    const iframe = videoRef.current;
    if (iframe && iframe.dataset.vimeoBound !== 'true') {
      iframe.dataset.vimeoBound = 'true';
      const startListening = () => {
        const win = iframe.contentWindow;
        if (!win) return;
        win.postMessage(JSON.stringify({ method: 'addEventListener', value: 'play' }), '*');
        win.postMessage(JSON.stringify({ method: 'addEventListener', value: 'finish' }), '*');
      };
      iframe.addEventListener('load', startListening);
      startListening();
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://player.vimeo.com') return;
      if (event.source !== videoRef.current?.contentWindow) return;
      let data: any;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (!data || !data.event) return;

      if (data.event === 'play') {
        fireVideoEvent('video_play');
      } else if (data.event === 'finish') {
        fireVideoEvent('video_complete');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [step, isQuizCompleted, submissionResult]);

  const status: StatusKey = STATUS_ORDER.includes(submissionResult?.scoreStatus as StatusKey)
    ? (submissionResult.scoreStatus as StatusKey)
    : 'Delayed';

  const childName = submissionResult?.childFirstName?.trim() || '';
  const names = nameForms(childName);

  const content = STATUS_CONTENT[status];
  const explain = content.explain ? content.explain(names, childAgeMonths) : null;
  const leads = content.leads(names, childAgeMonths);

  // Fires cta_click with both a fully-qualified id (e.g. "atrisk_masterclass") and the
  // underlying cta_type/result_status split out separately, so GA4 reporting can break down
  // by result status, by CTA type, or by the exact combination without extra setup.
  const handleCtaClick = (cta: Cta) => () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cta_click', {
        page_location_custom: 'quiz_results',
        cta_name: cta.dataCtaId,
        cta_id: cta.dataCtaId,
        cta_type: cta.ctaType,
        cta_label: cta.dataCtaName,
        result_status: submissionResult?.scoreStatus,
        link_url: cta.href,
      });
    }
  };

  return (
    <div className="qr-page">
      <style>{`
        @font-face{font-family:"Gilmer";font-style:normal;font-weight:400;font-display:swap;
          src:url(/fonts/gilmer-400.woff2) format("woff2")}
        @font-face{font-family:"Gilmer";font-style:normal;font-weight:700;font-display:swap;
          src:url(/fonts/gilmer-700.woff2) format("woff2")}
        @font-face{font-family:"Gilmer";font-style:normal;font-weight:800;font-display:swap;
          src:url(/fonts/gilmer-800.woff2) format("woff2")}
        .qr-page{
          --qr-ink:#241f2e; --qr-muted:#6b7078; --qr-line:#e9e6df;
          --qr-yellow:#fbee4b; --qr-yellow-ink:#5c5300; --qr-yellow-l:#fdf6c4;
          --qr-teal:#2fbcab; --qr-teal-deep:#12594f; --qr-teal-l:#dbf3ef;
          --qr-purple:#c98bfb; --qr-purple-deep:#7b3fa8; --qr-purple-l:#f4e7fd;
          --qr-hero:#fdfbe0;
          margin:0;background:#fff;color:var(--qr-ink);
          font-family:"Gilmer",-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
          line-height:1.55;-webkit-font-smoothing:antialiased;
        }
        .qr-page *{box-sizing:border-box}
        .qr-wrap{max-width:880px;margin:0 auto;padding:0 24px 90px}
        @media (min-width:721px){ .qr-wrap{max-width:960px;padding-left:40px;padding-right:40px} }

        .qr-hero{background:var(--qr-hero);border-radius:0 0 48px 48px;padding:56px 24px 56px;margin:0 0 26px;
              position:relative;overflow:hidden}
        .qr-petal{position:absolute;top:-60px;right:-60px;width:220px;height:220px;opacity:.9}
        .qr-petal-bl{position:absolute;bottom:-60px;left:-60px;width:220px;height:220px;opacity:.9}

        .qr-hero h1{font-size:42px;line-height:1.14;letter-spacing:-1px;text-align:center;margin:0 0 28px;font-weight:800;
              position:relative;z-index:1;max-width:680px;margin-left:auto;margin-right:auto}
        .qr-hero h1 em{font-style:normal;color:#927a00}

        .qr-band{margin:0 auto;max-width:560px;position:relative;z-index:1;background:#fff;border-radius:24px;
              padding:22px 24px 20px;box-shadow:0 10px 30px rgba(46,20,70,.10)}
        .qr-track{position:relative;height:14px;margin-bottom:16px;border-radius:999px;overflow:visible;
              background:linear-gradient(90deg,var(--qr-purple) 0 33%,var(--qr-yellow) 33% 66%,var(--qr-teal) 66% 100%)}
        .qr-marker-wrap{position:absolute;top:-30px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px}
        .qr-marker-tag{font-size:10.5px;font-weight:700;color:#fff;background:var(--qr-ink);padding:3px 8px;border-radius:999px;white-space:nowrap}
        .qr-marker{width:22px;height:22px;border-radius:50%;background:#fff;border:4px solid var(--qr-ink);box-shadow:0 2px 6px rgba(0,0,0,.18)}
        .qr-pills{display:flex;gap:8px}
        .qr-pill{flex:1;text-align:center;padding:10px 6px;border-radius:999px;font-weight:700;
              font-size:12.5px;letter-spacing:.3px}

        .qr-explain{font-size:18px;line-height:1.6;margin:0 auto 20px;max-width:720px;color:#3a3542;text-align:center}
        .qr-inbox{display:flex;align-items:center;justify-content:center;gap:8px;
               color:var(--qr-muted);font-size:14px;margin:0 0 22px}

        .qr-wrap h2{font-size:27px;line-height:1.25;letter-spacing:-.5px;margin:0 0 20px;font-weight:800}

        .qr-video{border-radius:18px;overflow:hidden;margin-bottom:26px;box-shadow:0 16px 36px rgba(36,31,46,.16)}
        .qr-video .qr-frame{background:linear-gradient(135deg,#2a2733,#1c1a22);position:relative;aspect-ratio:3/2}

        .qr-turn{font-size:17px;line-height:1.62;margin:0 0 16px;max-width:720px;color:#3a3542}
        .qr-turn:last-of-type{margin-bottom:34px}
        .qr-turn em{font-style:normal;font-weight:700;color:#241f2e}
        .qr-lead{font-size:17px;line-height:1.62;margin:0 0 18px;max-width:720px;color:#3a3542}
        .qr-lead:last-of-type{margin-bottom:32px}

        .qr-steps-panel{background:#f9f9e5;border-radius:28px;padding:40px 32px 44px;margin:0 0 58px}
        @media (min-width:721px){ .qr-steps-panel{padding:48px 48px 52px} }
        .qr-steps-panel h2{margin:0 0 20px}
        .qr-next-steps{margin:0 0 58px}
        .qr-next-steps h2{margin:0 0 20px}

        .qr-opts{display:flex;gap:24px}
        .qr-opt{flex:1;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;border:2px solid transparent}
        .qr-opt.qr-teal{border-color:var(--qr-teal);box-shadow:-6px 6px 0 0 var(--qr-teal)}
        .qr-opt.qr-purple{border-color:var(--qr-purple);box-shadow:-6px 6px 0 0 var(--qr-purple)}
        .qr-opt .qr-head{padding:20px 22px;color:#fff}
        .qr-opt.qr-teal .qr-head{background:var(--qr-teal)}
        .qr-opt.qr-purple .qr-head{background:var(--qr-purple);color:#fff}
        .qr-opt .qr-time{display:inline-block;font-size:11.5px;font-weight:800;letter-spacing:.4px;
              background:#fff;padding:5px 12px;border-radius:999px;margin-bottom:10px}
        .qr-opt.qr-teal .qr-time{color:var(--qr-teal-deep)}
        .qr-opt.qr-purple .qr-time{color:var(--qr-purple-deep)}
        .qr-opt .qr-head h3{margin:0;font-size:22px;line-height:1.2;letter-spacing:-.3px;font-weight:800;color:#fff}
        .qr-opt .qr-body{background:#fff;padding:22px;display:flex;flex-direction:column;flex:1}
        .qr-opt p{margin:0 0 22px;font-size:15.5px;line-height:1.55;color:#4a4f57;flex:1}
        .qr-opt p.qr-free{margin:0 0 20px;font-size:14px;color:var(--qr-muted);flex:none}
        .qr-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px}
        .qr-chip{font-size:13px;padding:6px 12px;border-radius:999px;background:#eaf7f4;color:#3a7d72;border:1px solid #d3ece6}
        .qr-cta{display:block;text-align:center;text-decoration:none;font-weight:800;font-size:16px;
             padding:15px 18px;border-radius:999px;color:#fff;border:2px solid transparent;
             box-shadow:0px 0px 0px 0px rgba(0,0,0,.17);
             transition:background-color .3s,color .3s,border-color .3s,box-shadow .32s ease-out,transform .15s ease}
        .qr-opt.qr-teal .qr-cta{background:var(--qr-teal);border-color:var(--qr-teal)}
        .qr-opt.qr-purple .qr-cta{background:var(--qr-purple);color:#fff;border-color:var(--qr-purple)}
        .qr-opt.qr-teal .qr-cta:hover,.qr-opt.qr-teal .qr-cta:focus-visible{background:#fff;color:var(--qr-teal-deep);box-shadow:0px 6px 0px 0px rgba(0,0,0,.17)}
        .qr-opt.qr-purple .qr-cta:hover,.qr-opt.qr-purple .qr-cta:focus-visible{background:#fff;color:var(--qr-purple-deep);box-shadow:0px 6px 0px 0px rgba(0,0,0,.17)}
        .qr-cta:active{transform:translateY(6px);box-shadow:0px 0px 0px 0px rgba(0,0,0,.17);
             transition:box-shadow .14s ease-in,transform .12s ease-in}

        .qr-footer{margin-top:44px;padding-top:26px;border-top:1px solid var(--qr-line);color:#8d939b;font-size:12.5px;line-height:1.6}
        .qr-footer b{color:#6b7078;display:block;margin-bottom:5px;font-size:12.5px}
        .qr-footer p{margin:0 0 16px;max-width:760px}
        .qr-footer a{color:#6b7078}

        @media (max-width:720px){
          .qr-wrap{padding-left:12px;padding-right:12px}
          .qr-hero{border-radius:0 0 28px 28px;padding:32px 18px 38px}
          .qr-hero h1{font-size:29px}
          .qr-wrap h2{font-size:22px}
          .qr-petal{width:140px;height:140px;top:-30px;right:-30px}
          .qr-petal-bl{width:140px;height:140px;bottom:-30px;left:-30px}
          .qr-steps-panel{padding:28px 20px 32px;border-radius:20px}
          .qr-opts{flex-direction:column}
          .qr-opt.qr-first-mobile{order:-1}
        }
      `}</style>

      <div className="qr-hero">
        <svg className="qr-petal" viewBox="0 0 220 220" fill="none" aria-hidden="true">
          <circle cx="190" cy="20" r="48.0" fill="var(--qr-teal)" opacity=".24"/>
          <path d="M91.0,28.8 A40.8,40.8 0 0,1 165.0,63.2 Z" fill="var(--qr-yellow)" opacity=".34"/>
          <path d="M180.5,106.2 A33.6,33.6 0 0,1 119.5,77.8 Z" fill="var(--qr-purple)" opacity=".28"/>
          <circle cx="48" cy="150" r="21.6" fill="var(--qr-teal)" opacity=".2"/>
          <path d="M65.7,157.4 A18.0,18.0 0 0,1 98.3,172.6 Z" fill="var(--qr-yellow)" opacity=".3"/>
        </svg>
        <svg className="qr-petal-bl" viewBox="0 0 220 220" fill="none" aria-hidden="true">
          <circle cx="172" cy="70" r="21.6" fill="var(--qr-teal)" opacity=".2"/>
          <path d="M154.3,62.6 A18.0,18.0 0 0,1 121.7,47.4 Z" fill="var(--qr-yellow)" opacity=".3"/>
          <path d="M39.5,113.8 A33.6,33.6 0 0,1 100.5,142.2 Z" fill="var(--qr-teal)" opacity=".28"/>
        </svg>
        <div className="qr-wrap" style={{ paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }}>
          <h1>{names.capPoss} talking is in the <em>{status}</em> range for their age.</h1>

          <div className="qr-band">
            <div className="qr-track">
              <div className="qr-marker-wrap" style={{ left: status === 'Delayed' ? '16.6%' : status === 'At Risk' ? '50%' : '83.3%' }}>
                <span className="qr-marker-tag">{names.cap} is here</span>
                <div className="qr-marker"></div>
              </div>
            </div>
            <div className="qr-pills">
              {STATUS_ORDER.map((key) => {
                const tone = PILL_TONES[key];
                const isOn = key === status;
                return (
                  <div key={key} className="qr-pill" style={{ background: isOn ? tone.onBg : tone.offBg, color: isOn ? tone.onFg : tone.offFg }}>
                    {tone.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="qr-wrap">
        {explain && <p className="qr-explain">{explain}</p>}

        <p className="qr-inbox">
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#6b7078" strokeWidth="1.6">
            <rect x="2" y="4" width="16" height="12" rx="2"/><path d="M2.5 5.5 10 11l7.5-5.5"/>
          </svg>
          Your full results and next steps are on their way to your inbox.
        </p>

        <h2>Let me explain what this result means</h2>

        <div className="qr-video">
          <div className="qr-frame">
            <iframe
              ref={videoRef}
              src={`https://player.vimeo.com/video/${content.videoId}?autoplay=0&muted=0&playsinline=1&title=0&byline=0&portrait=0&dnt=1`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={`${status} result explainer`}
            ></iframe>
          </div>
        </div>

        {content.turns && (
          <>
            <p className="qr-turn">If you&rsquo;ve suspected this for a while, let this be the moment you <em>trust your instincts</em> and let go of the old &ldquo;wait and see&rdquo; advice.</p>
            <p className="qr-turn">And if it&rsquo;s come as a surprise, that&rsquo;s okay too. My own daughter developed a stutter and I&rsquo;m a Speechie for goodness sake! It&rsquo;s not your fault, but it is something to start thinking about.</p>
          </>
        )}

        <div className={status === 'On Track' ? 'qr-next-steps' : 'qr-steps-panel'}>
          <h2>My recommended next steps</h2>

          {leads.map((paragraph, i) => (
            <p className="qr-lead" key={i}>{paragraph}</p>
          ))}

          <div className="qr-opts">
            {content.ctas.map((cta) => (
              <div key={cta.id} className={`qr-opt qr-${cta.tone}${cta.mobileFirst ? ' qr-first-mobile' : ''}`}>
                <div className="qr-head">
                  <span className="qr-time">{cta.time}</span>
                  <h3>{cta.title}</h3>
                </div>
                <div className="qr-body">
                  <p>{cta.body}</p>
                  {cta.chips && (
                    <div className="qr-chips">
                      {cta.chips.map((chip) => <span className="qr-chip" key={chip}>{chip}</span>)}
                    </div>
                  )}
                  {cta.freeNote && <p className="qr-free">{cta.freeNote}</p>}
                  <a
                    className="qr-cta"
                    href={cta.href}
                    id={cta.id}
                    data-cta-id={cta.dataCtaId}
                    data-cta-name={cta.dataCtaName}
                    onClick={handleCtaClick(cta)}
                  >
                    {cta.ctaText}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="qr-footer">
          <b>About the Late Talker Quiz™</b>
          <p>The Late Talker Quiz™ uses clinically proven tools and age-specific normative data to give you an accurate snapshot of your child&apos;s communication skills. It classifies their development as Delayed, At Risk or On Track so you have clear, science-backed information to share with your doctor or specialist, and know exactly what to do next.</p>
          <b>Disclaimer</b>
          <p>This is a screening tool, not a diagnosis. It indicates a level of risk based on the information you provided. For a diagnosis or personalised therapy, see a speech pathologist or your preferred health professional. Individual results vary and we make no guarantee of outcomes. <a href={TERMS_URL} target="_blank" rel="noopener noreferrer">Full terms here.</a></p>
        </div>
      </div>
    </div>
  );
}

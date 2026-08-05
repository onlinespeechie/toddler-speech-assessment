'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, User } from 'lucide-react';

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
  };
  onRestart: () => void;
  isQuizCompleted?: boolean;
  step?: string;
}

export default function ResultsPage({ 
  submissionResult, 
  onRestart, 
  isQuizCompleted = true,
  step = 'result'
}: ResultsPageProps) {
  useEffect(() => {
    // STRICT GUARD: Must be on the final results step with valid submission data
    if ((step === 'result' || isQuizCompleted) && submissionResult && typeof window !== 'undefined') {
      // Unique key per submission (uses submission ID or email)
      const leadId = submissionResult.id || submissionResult.email || 'completed';
      const storageKey = `meta_lead_fired_${leadId}`;

      // Only fire if this specific thank-you completion has NOT been tracked yet
      if (!sessionStorage.getItem(storageKey) && window.fbq) {
        // Lock immediately BEFORE tracking to prevent race conditions
        sessionStorage.setItem(storageKey, 'true');

        // Execute explicit Meta Lead event
        window.fbq('track', 'Lead', {}, { eventID: String(leadId) });
        console.log('✅ Meta Lead tracked successfully on Thank You page:', leadId);
      }
    }
  }, [step, isQuizCompleted, submissionResult]);

  const status = submissionResult?.scoreStatus || 'Delayed';
  
  const contentMap = {
    'Delayed': {
      subheading: "Based on your answers, your child requires extra support with their communication development.",
      iconColor: "#EB0E0E",
      iconZone: "16.6%",
      textBox: "You caught this early - and early action makes the biggest difference. With the right strategies at home, progress can happen faster than you think.",
      vimeoLink: "https://player.vimeo.com/video/1192800109?h=3ebdd1bfb1&fl=ip&fe=ec",
      portraitVimeoLink: "https://player.vimeo.com/video/1195269986?h=f276444b85"
    },
    'At Risk': {
      subheading: "Based on your answers, your child is showing signs that they will benefit from extra support with their communication development.",
      iconColor: "#FFD723",
      iconZone: "50%",
      textBox: "You're ahead of the curve. Most parents don't look into this until things are more concerning - you're already in the best position to make a difference.",
      vimeoLink: "https://player.vimeo.com/video/1192800080?h=620fd124e5&fl=ip&fe=ec",
      portraitVimeoLink: "https://player.vimeo.com/video/1195271605?h=b3e59ec1ac"
    },
    'On Track': {
      subheading: "Based on your answers, your child is showing signs that they are on track for their age.",
      iconColor: "#15C151",
      iconZone: "83.3%",
      textBox: "Your child is right where they need to be - and with the right input at home, you can help them stay that way and keep building.",
      vimeoLink: "https://player.vimeo.com/video/1192800045?h=307d30c466&fl=ip&fe=ec",
      portraitVimeoLink: "https://player.vimeo.com/video/1195270029?h=6055781d5f"
    }
  };

  const currentContent = contentMap[status as keyof typeof contentMap] || contentMap['Delayed'];

  const testimonials = [
    { id: 1, text: "It's definitely made me a more confident mum now.", author: "Claudia A.", img: "/Claudia A.jpg" },
    { id: 2, text: "He went from not making eye contact or speaking at all to being described as very chatty by his teacher.", author: "Jessica V.", img: "/Jessica V.jpg" },
    { id: 3, text: "Ready Set Talk gave me the confidence and the hope that I can do this, it's been really life-changing for both me and Roper.", author: "Melissa M.", img: "/Melissa M.jpg" },
    { id: 4, text: "He's now saying his first words and even linking them together - it's incredible to see his progress!", author: "Rebekah H.", img: "/Rebekah H.jpg" }
  ];

  const ctaLink = "https://onlinespeechie.com/osbundle?OS_BUNDLE_PRODUCT_IDS=9249&OS_BUNDLE_QTYS=1&OS_BUNDLE_COUPON=quizrst100&OS_BUNDLE_DEFAULT_REDIRECT=checkout";

  return (
    <div style={{ width: '100%', backgroundColor: '#ffffff', color: '#383838', fontFamily: 'inherit' }}>
      <style>{`
        .video-card {
          width: 100%;
          background-color: #F9F9E5;
          border: 3px solid #D387FF;
          border-radius: 12px;
          box-shadow: -8px 8px 0px 0px rgba(211,135,255,1);
          display: flex;
          flex-wrap: wrap;
          overflow: hidden;
          margin-bottom: 80px;
          box-sizing: border-box;
        }
        .video-wrapper-desktop {
          display: none;
        }
        .video-wrapper-mobile {
          display: block;
          background-color: #000000;
          position: relative;
          width: 100%;
          aspect-ratio: 9/16;
        }
        .video-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 16px;
          padding: 32px 15px;
          box-sizing: border-box;
          flex: 1 1 350px;
        }
        .pitch-top {
          display: flex;
          flex-direction: column;
          gap: 36px;
          padding: 30px 15px;
          box-sizing: border-box;
          width: 100%;
        }
        .pitch-columns {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }
        .pitch-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pitch-bottom {
          width: 100%;
          background-color: #2EBCAB;
          padding: 30px 15px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;
          box-sizing: border-box;
        }
        .testimonials-container {
          display: flex;
          flex-direction: column;
          gap: 32px;
          width: 100%;
          box-sizing: border-box;
        }
        .testimonial-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          box-sizing: border-box;
          width: 100%;
        }
        .bio-container {
          width: 100%;
          max-width: 1080px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 40px;
          margin-bottom: 80px;
          box-sizing: border-box;
        }
        .bio-image-wrapper {
          position: relative;
          width: 100%;
          max-width: 460px;
          aspect-ratio: 460/340;
          background-color: #D4D6B6;
          border-radius: 16px;
          box-sizing: border-box;
        }
        .bio-image-inner {
          position: absolute;
          top: -10px;
          left: 10px;
          width: 100%;
          height: 100%;
          background-color: #ffffff;
          border-radius: 16px;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        .bio-text {
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex: 1 1 300px;
          color: #383838;
        }
        @media (min-width: 900px) {
          .video-card {
            flex-wrap: nowrap;
            height: 350px;
            align-items: stretch;
          }
          .video-wrapper-desktop {
            display: block;
            background-color: #000000;
            position: relative;
            width: 622px;
            height: 350px;
            flex-shrink: 0;
          }
          .video-wrapper-mobile {
            display: none;
          }
          .video-text {
            height: 350px;
            padding: 32px 40px;
          }
          .pitch-top {
            padding: 30px 40px;
          }
          .pitch-columns {
            flex-direction: row;
            gap: 32px;
          }
          .pitch-bottom {
            flex-direction: row;
            justify-content: space-between;
            gap: 80px;
            padding: 30px 40px;
          }
          .testimonials-container {
            flex-direction: row;
            flex-wrap: nowrap;
            justify-content: space-between;
          }
          .testimonial-item {
            flex: 1 1 23%;
            max-width: 25%;
          }
          .bio-container {
            flex-wrap: nowrap;
            gap: 64px;
          }
          .bio-image-wrapper {
            flex: 0 0 460px;
            height: 340px;
            aspect-ratio: auto;
          }
        }
      `}</style>
      <div style={{ width: '100%', maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px', paddingBottom: '40px', paddingLeft: '24px', paddingRight: '24px', boxSizing: 'border-box' }}>
        
        {/* Title Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', marginBottom: '30px', width: '100%' }}>
          <h1 style={{ fontSize: '48px', lineHeight: '56px', textAlign: 'center', margin: 0 }}>
            Your results are ready!
          </h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%', maxWidth: '640px' }}>
            <p style={{ fontSize: '18px', lineHeight: '26px', textAlign: 'center', margin: 0, fontWeight: 500 }}>
              {currentContent.subheading}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', maxWidth: '545px' }}>
              <div style={{ position: 'relative', width: '100%', height: '3px', background: 'linear-gradient(to right, #EB0E0E, #FFD723, #15C151)', borderRadius: '99px', marginTop: '16px' }}>
                <motion.div 
                  style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', marginLeft: '-18px', width: '36px', height: '36px', backgroundColor: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${currentContent.iconColor}` }}
                  initial={{ left: "16.6%" }}
                  animate={{ left: currentContent.iconZone }}
                  transition={{ type: "spring", stiffness: 60, damping: 15 }}
                >
                  <User size={18} color={currentContent.iconColor} />
                </motion.div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '175px', height: '40px', backgroundColor: '#EB0E0E', borderRadius: '25px' }}>
                  <span style={{ fontSize: '18px', color: '#ffffff', fontWeight: 'bold' }}>DELAYED</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '175px', height: '40px', backgroundColor: '#FFD723', borderRadius: '25px' }}>
                  <span style={{ fontSize: '18px', color: '#383838', fontWeight: 'bold' }}>AT RISK</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '175px', height: '40px', backgroundColor: '#15C151', borderRadius: '25px' }}>
                  <span style={{ fontSize: '18px', color: '#ffffff', fontWeight: 'bold' }}>ON TRACK</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Text Box */}
        <div style={{ width: '100%', maxWidth: '640px', backgroundColor: '#2EBCAB', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px', marginBottom: '80px', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '24px', lineHeight: '32px', textAlign: 'center', color: '#ffffff', margin: 0 }}>
            The good news?
          </h2>
          <div style={{ width: '20px', height: '1px', backgroundColor: '#ffffff', margin: '8px 0' }}></div>
          <p style={{ fontSize: '16px', lineHeight: '22px', textAlign: 'center', color: '#ffffff', margin: 0 }}>
            {currentContent.textBox}
          </p>
          <p style={{ fontSize: '16px', lineHeight: '22px', textAlign: 'center', color: '#ffffff', margin: '8px 0 0 0', fontWeight: 'bold' }}>
            Watch the video below to understand what your results mean and your next steps.
          </p>
        </div>

        {/* Video Section */}
        <div className="video-card">
          <div className="video-wrapper-desktop">
            <iframe 
              src={currentContent.vimeoLink} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
          <div className="video-wrapper-mobile">
            <iframe 
              src={currentContent.portraitVimeoLink} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
          <div className="video-text">
            <h2 style={{ fontSize: '24px', lineHeight: '32px', color: '#383838', margin: 0 }}>
              In this video: What your results mean & what to focus on next
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '26px', color: '#383838', margin: 0 }}>
              Your full results and personalised action plan will be emailed to you shortly.
            </p>
          </div>
        </div>

        {/* Ready, Set, Talk pitch introduction */}
        <div style={{ width: '100%', maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', lineHeight: '36px', color: '#383838', margin: 0 }}>
            A simple, step-by-step plan to help your <span style={{ color: '#2EBCAB' }}>toddler talk </span>using your <span style={{ color: '#D387FF' }}>everyday moments</span>
          </h2>
          <p style={{ fontSize: '18px', lineHeight: '26px', color: '#383838', margin: 0 }}>
            like bath time, snack, play and the <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>everyday magic</span> you already share.
          </p>
        </div>

        {/* CTA Button */}
        <div 
          style={{ backgroundColor: '#F9F9E5', padding: '12px 24px', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '80px' }}
        >
          <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#383838' }}>
            Ready, Set…Talk!™
          </span>
        </div>

        {/* Full Pitch Container */}
        <div style={{ width: '100%', backgroundColor: '#F9F9E5', border: '3px solid #2EBCAB', borderRadius: '12px', boxShadow: '-8px 8px 0px 0px rgba(46,188,171,1)', display: 'flex', flexDirection: 'column', marginBottom: '80px', overflow: 'hidden', boxSizing: 'border-box' }}>
          
          {/* Top Frame 275 */}
          <div className="pitch-top">
            <h3 style={{ fontSize: '26px', lineHeight: '32px', color: '#383838', margin: 0, fontWeight: 700 }}>
              You’ll learn the <span style={{ color: '#2EBCAB' }}>exact strategies</span> I use as a paediatric speech pathologist to help late talkers:
            </h3>
            
            <div className="pitch-columns">
              {/* Left Column (Frame 274) */}
              <div className="pitch-col">
                {['Copy sounds and words', 'Communicate wants & needs', 'Stay engaged during play'].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={24} color="#2EBCAB" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '16px', color: '#383838', lineHeight: '24px' }}>{text}</span>
                  </div>
                ))}
              </div>
              
              {/* Right Column (Frame 273) */}
              <div className="pitch-col">
                {['Build vocabulary naturally', 'Make real progress at home in just 10 minutes a day'].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={24} color="#2EBCAB" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '16px', color: '#383838', lineHeight: '24px' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <p style={{ fontSize: '18px', fontWeight: 600, lineHeight: '24px', color: '#383838', margin: 0 }}>
              And because every strategy comes with real-life demos with real toddlers, you'll know exactly what to say, when to pause, and how to respond. No more guessing.
            </p>
          </div>

          {/* Bottom Bar inside Frame 255 */}
          <div className="pitch-bottom">
            <p style={{ fontSize: '16px', lineHeight: '22px', color: '#ffffff', flex: 1, margin: 0 }}>
              Whether your child needs a little boost or more ongoing support, <span style={{ fontWeight: 'bold' }}>Ready, Set…Talk!™</span> helps you stop second-guessing and start feeling capable, confident, and clear about how to help.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div style={{ fontWeight: 'bold', fontSize: '32px', lineHeight: '32px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                All for just <span style={{ position: 'relative', display: 'inline-block', fontSize: '0.85em' }}>$397<span style={{ position: 'absolute', left: 0, top: '50%', width: '100%', height: '3px', backgroundColor: '#D18AFF', transform: 'rotate(-15deg)', pointerEvents: 'none' }} /></span> → <span style={{ fontSize: '1.1em' }}>$297</span>
              </div>
              <a 
                href={ctaLink}
                style={{ backgroundColor: '#ffffff', borderRadius: '25px', padding: '12px 36px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', cursor: 'pointer' }}
              >
                <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#2EBCAB', whiteSpace: 'nowrap' }}>
                  Start Ready, Set…Talk!™
                </span>
              </a>
            </div>
          </div>
          
          {/* Bottom Bar Frame 256 */}
          <div style={{ width: '100%', padding: '16px 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
            <p style={{ fontSize: '16px', lineHeight: '20px', textAlign: 'center', color: '#D387FF', fontWeight: 700, margin: 0 }}>
              6 months of access • Watch anytime • 30-day confidence guarantee
            </p>
          </div>
        </div>

        {/* Testimonials */}
        <div style={{ width: '100%', maxWidth: '1080px', marginBottom: '80px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', boxSizing: 'border-box' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '32px', color: '#383838', marginBottom: '40px', margin: '0 0 40px 0' }}>What other parents say</h3>
            
            <div className="testimonials-container">
              {testimonials.map((t) => (
                <div key={t.id} className="testimonial-item">
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '3px solid #D387FF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8E8E8' }}>
                    {t.img ? (
                      <img src={t.img} alt={t.author} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={30} color="#9ca3af" />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '15px', lineHeight: '22px', color: '#383838', margin: 0, fontStyle: 'italic' }}>
                      “{t.text}”
                    </p>
                    <p style={{ fontWeight: 'bold', fontSize: '15px', color: '#383838', margin: 0 }}>
                      {t.author}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Author Bio Section */}
        <div className="bio-container">
          <div className="bio-image-wrapper">
             <div className="bio-image-inner">
                <img 
                  src="/saffira-profile.jpg" 
                  alt="Saffira - Online Speechie" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
             </div>
          </div>
          <div className="bio-text">
            <h2 style={{ fontWeight: 'bold', fontSize: '40px', lineHeight: '48px', margin: 0 }}>
              I&apos;ve Been on Both Sides
            </h2>
            <p style={{ fontSize: '18px', lineHeight: '26px', margin: 0 }}>
              Hi, I&apos;m Saffira—paediatric speech pathologist, mum, and founder of the <span style={{ fontWeight: 'bold' }}>Online Speechie</span>.
            </p>
            <p style={{ fontSize: '18px', lineHeight: '26px', margin: 0 }}>
              For over 14 years, I&apos;ve supported thousands of late-talking toddlers using practical, evidence-informed strategies that are now used by families worldwide.
            </p>
            <p style={{ fontSize: '18px', lineHeight: '26px', margin: 0 }}>
              I know parents don&apos;t need more vague advice or endless opinions, they need someone to show them exactly what to do, step by step.
            </p>
            <p style={{ fontSize: '18px', lineHeight: '26px', margin: 0 }}>
              That&apos;s why I created <span style={{ fontWeight: 'bold' }}>Ready, Set...Talk!™</span>.
            </p>
          </div>
        </div>

        {/* Final Bottom Purple CTA Section */}
        <div style={{ width: '100%', maxWidth: '800px', backgroundColor: '#D387FF', borderRadius: '16px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '16px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', marginBottom: '40px', boxSizing: 'border-box' }}>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
            6 months of access • Watch anytime • 30-day confidence guarantee
          </p>
          <h2 style={{ fontWeight: 'bold', fontSize: '34px', lineHeight: '34px', color: '#ffffff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            All for just <span style={{ position: 'relative', display: 'inline-block', fontSize: '0.85em' }}>$397<span style={{ position: 'absolute', left: 0, top: '50%', width: '100%', height: '3px', backgroundColor: '#2FBCAC', transform: 'rotate(-15deg)', pointerEvents: 'none' }} /></span> → <span style={{ fontSize: '1.1em' }}>$297</span>
          </h2>
          <a 
            href={ctaLink}
            style={{ backgroundColor: '#ffffff', color: '#D387FF', padding: '11px 16px', borderRadius: '9999px', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', textDecoration: 'none', position: 'relative', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}
          >
            Start Ready, Set...Talk!™
          </a>
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, User } from 'lucide-react';

interface ResultsPageProps {
  submissionResult: {
    scoreStatus: string;
    communicationStage: string;
    id: string;
  };
  onRestart: () => void;
}

export default function ResultsPage({ submissionResult, onRestart }: ResultsPageProps) {
  const status = submissionResult?.scoreStatus || 'Delayed';
  
  const contentMap = {
    'Delayed': {
      subheading: "Based on your answers, your child is showing signs that they will benefit from extra support with their talking.",
      iconColor: "#EB0E0E",
      iconZone: "16.6%",
      textBox: "Talking starts long before clear words. Gestures, sounds, pointing, reaching, and “almost words” are all important mini-milestones, and with the right support, these moments can become real progress.",
      vimeoLink: "https://player.vimeo.com/video/1192800109?h=3ebdd1bfb1"
    },
    'At Risk': {
      subheading: "The results suggest your child is developing well, though they may benefit from targeted support in certain areas.",
      iconColor: "#FFD723",
      iconZone: "50%",
      textBox: "There are many positive indicators, yet a little extra attention now could make a great deal of difference.",
      vimeoLink: "https://player.vimeo.com/video/1192800080?h=620fd124e5"
    },
    'On Track': {
      subheading: "Splendid news! Based on your answers, your child’s speech development appears to be progressing exactly as we would hope.",
      iconColor: "#15C151",
      iconZone: "83.3%",
      textBox: "You are doing a wonderful job. Continue to encourage their natural curiosity and these milestones will flourish.",
      vimeoLink: "https://player.vimeo.com/video/1192800045?h=307d30c466"
    }
  };

  const currentContent = contentMap[status as keyof typeof contentMap] || contentMap['Delayed'];

  const testimonials = [
    { id: 1, text: "The support we received here was truly wonderful. The team made everything feel so clear and manageable, providing us with practical steps that actually fit into our daily life. It has made a world of difference to our child’s confidence.”", author: "Kayla" },
    { id: 2, text: "This program has been a game changer for our family. The strategies are so easy to implement during our everyday routines, and we saw improvements almost immediately.”", author: "Sarah M." },
    { id: 3, text: "I finally feel like I have the tools to help my child. The videos are incredibly clear and the step-by-step approach takes all the guesswork out of speech practice.”", author: "Jessica T." }
  ];

  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -100) {
      setCurrentTestimonial((prev) => prev + 1);
    } else if (swipe > 100) {
      setCurrentTestimonial((prev) => prev - 1);
    }
  };

  const ctaLink = "https://onlinespeechie.com/checkout/?add-to-cart=9249";

  return (
    <div style={{ width: '100%', backgroundColor: '#ffffff', color: '#383838', fontFamily: 'inherit' }}>
      <div style={{ width: '100%', maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px', paddingBottom: '40px', paddingLeft: '24px', paddingRight: '24px', boxSizing: 'border-box' }}>
        
        {/* Title Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '64px', marginBottom: '64px', width: '100%' }}>
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
        </div>

        {/* Video Section */}
        <div style={{ width: '100%', backgroundColor: '#F9F9E5', border: '3px solid #D387FF', borderRadius: '12px', boxShadow: '-8px 8px 0px 0px rgba(211,135,255,1)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '28px', overflow: 'hidden', marginBottom: '80px', boxSizing: 'border-box' }}>
          <div style={{ flex: '1 1 632px', aspectRatio: '16/9', backgroundColor: '#000000', position: 'relative', minWidth: '300px' }}>
            <iframe 
              src={currentContent.vimeoLink} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '32px 40px', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '24px', lineHeight: '32px', color: '#383838', margin: 0 }}>
              What your results mean, and what to focus on next
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '26px', color: '#383838', margin: 0 }}>
              In this short video, I’ll walk you through:<br/>
              - what your result means<br/>
              - what actually helps late talkers progress<br/>
              - and the next steps I’d recommend from here
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
          <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
            {/* Left Column */}
            <div style={{ flex: '1 1 350px', borderRight: '3px solid #2EBCAB', display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px 40px', boxSizing: 'border-box' }}>
              <h3 style={{ fontSize: '26px', lineHeight: '32px', color: '#383838', margin: 0 }}>
                You’ll learn the <span style={{ color: '#2EBCAB' }}>exact strategies</span> I use as a paediatric speech pathologist to help late talkers:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['Copy sounds and words', 'Communicate wants & needs', 'Stay engaged during play', 'Build vocabulary naturally'].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={24} color="#2EBCAB" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '16px', color: '#383838', lineHeight: '24px' }}>{text}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <CheckCircle2 size={24} color="#2EBCAB" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#383838', lineHeight: '24px' }}>And make real progress at home in just 10 minutes a day</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '32px 40px', boxSizing: 'border-box' }}>
              <p style={{ fontWeight: 500, fontSize: '18px', lineHeight: '24px', color: '#383838', margin: 0 }}>
                Unlike generic parenting advice or social media tips, you won’t just be told what to do.
              </p>
              <h3 style={{ fontSize: '26px', lineHeight: '32px', color: '#383838', margin: 0 }}>
                You’ll see <span style={{ color: '#D387FF' }}>real-life demonstrations</span> with <span style={{ textDecoration: 'underline' }}>real toddlers</span>, so you know exactly:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['What to say', 'When to pause', 'How to respond'].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={24} color="#D387FF" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '16px', color: '#383838', lineHeight: '20px' }}>{text}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <CheckCircle2 size={24} color="#D387FF" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#383838', lineHeight: '20px' }}>And how to turn everyday moments into word learning opportunities</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar inside Frame 245 */}
          <div style={{ width: '100%', backgroundColor: '#2EBCAB', padding: '32px 40px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '40px', boxSizing: 'border-box' }}>
            <p style={{ fontSize: '16px', lineHeight: '22px', color: '#ffffff', maxWidth: '400px', margin: 0 }}>
              Whether your child needs a little boost or more ongoing support, <span style={{ fontWeight: 'bold' }}>Ready, Set…Talk!™</span> helps you stop second-guessing and start feeling capable, confident, and clear about how to help.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '32px', lineHeight: '32px', color: '#ffffff' }}>
                All for just $397
              </div>
              <a 
                href={ctaLink}
                style={{ backgroundColor: '#ffffff', borderRadius: '25px', padding: '12px 36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px', textDecoration: 'none', cursor: 'pointer' }}
              >
                <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#2EBCAB' }}>
                  Start Ready, Set…Talk!™
                </span>
              </a>
            </div>
          </div>
          
          <div style={{ width: '100%', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
            <p style={{ fontSize: '16px', lineHeight: '20px', textAlign: 'center', color: '#383838', margin: 0 }}>
              Instant access • Watch anytime • 30-day confidence guarantee
            </p>
          </div>
        </div>

        {/* Testimonials */}
        <div style={{ width: '100%', maxWidth: '1080px', marginBottom: '80px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', boxSizing: 'border-box' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '32px', color: '#383838', marginBottom: '40px', margin: '0 0 40px 0' }}>What other parents say</h3>
            
            <div style={{ position: 'relative', width: '100%', maxWidth: '844px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
              <button 
                onClick={() => setCurrentTestimonial((prev) => prev - 1)} 
                style={{ position: 'absolute', left: '-20px', zIndex: 10, padding: '10px', backgroundColor: '#ffffff', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={24} color="#383838" />
              </button>

              <div style={{ 
                position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
                maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
              }}>
                <motion.div
                  animate={{ x: -currentTestimonial * 740 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{ position: 'absolute', left: '50%', height: '100%', display: 'flex', alignItems: 'center' }}
                >
                  {(() => {
                    const N = testimonials.length * 2;
                    const extended = [...testimonials, ...testimonials];
                    return extended.map((test, idx) => {
                      const cycle = Math.floor((currentTestimonial - idx + 2) / N);
                      const pos = (idx + cycle * N) * 740;
                      return (
                        <div key={idx} style={{ 
                          position: 'absolute', left: pos - 350,
                          width: '700px', height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '32px', boxSizing: 'border-box',
                          opacity: 1,
                          transition: 'opacity 0.3s'
                        }}>
                          <div style={{ width: '100px', height: '100px', borderRadius: '100px', backgroundColor: '#2f6d4e', border: '6px solid #D387FF', overflow: 'hidden', flexShrink: 0, boxSizing: 'border-box' }}>
                            <div style={{ width: '100%', height: '100%', backgroundColor: '#E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={40} color="#9ca3af" />
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '353px', flex: '1 1 auto' }}>
                            <p style={{ fontSize: '16px', lineHeight: '22px', color: '#383838', margin: 0 }}>
                              {test.text}
                            </p>
                            <p style={{ fontWeight: 'bold', fontSize: '16px', color: '#383838', margin: 0 }}>
                              {test.author}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </motion.div>
              </div>

              <button 
                onClick={() => setCurrentTestimonial((prev) => prev + 1)} 
                style={{ position: 'absolute', right: '-20px', zIndex: 10, padding: '10px', backgroundColor: '#ffffff', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={24} color="#383838" />
              </button>
            </div>
            
            {/* Indicators */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  style={{ width: '10px', height: '10px', borderRadius: '50%', border: 'none', backgroundColor: idx === ((currentTestimonial % testimonials.length) + testimonials.length) % testimonials.length ? '#383838' : '#E8E8E8', cursor: 'pointer', transition: 'background-color 0.2s' }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Author Bio Section */}
        <div style={{ width: '100%', maxWidth: '1080px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '64px', marginBottom: '80px', boxSizing: 'border-box' }}>
          <div style={{ flex: '1 1 460px', maxWidth: '460px', height: '340px', backgroundColor: '#D4D6B6', borderRadius: '16px', position: 'relative', flexShrink: 0 }}>
             <div style={{ position: 'absolute', top: '-10px', left: '10px', width: '100%', height: '100%', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                <img 
                  src="/saffira-profile.jpg" 
                  alt="Saffira - Online Speechie" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
             </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: '1 1 300px', color: '#383838' }}>
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
            Instant access • Watch anytime • 30-day confidence guarantee
          </p>
          <h2 style={{ fontWeight: 'bold', fontSize: '34px', lineHeight: '34px', color: '#ffffff', margin: '0 0 8px 0' }}>
            All for just $397
          </h2>
          <a 
            href={ctaLink}
            style={{ backgroundColor: '#ffffff', color: '#D387FF', padding: '11px 28px', borderRadius: '9999px', fontWeight: 'bold', fontSize: '17px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', textDecoration: 'none', position: 'relative', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
          >
            Start Ready, Set...Talk!™
          </a>
        </div>

        {/* Bottom Actions */}
        <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '24px', marginTop: '40px', paddingTop: '40px', borderTop: '1px solid #f3f4f6', boxSizing: 'border-box' }}>
          {submissionResult?.id && (
            <a 
              href={`/api/pdf/${submissionResult.id}`} 
              target="_blank" 
              style={{ padding: '16px 32px', border: '2px solid #2EBCAB', color: '#2EBCAB', borderRadius: '9999px', fontWeight: 'bold', fontSize: '18px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
            >
              Download Full Report
            </a>
          )}
          <button 
            onClick={onRestart}
            style={{ padding: '16px 32px', backgroundColor: '#E8E8E8', color: '#383838', borderRadius: '9999px', fontWeight: 'bold', fontSize: '18px', border: 'none', cursor: 'pointer' }}
          >
            Start New Check-In
          </button>
        </div>

      </div>
    </div>
  );
}

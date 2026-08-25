'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

// CSS-based animation components for maximum performance
// No Framer Motion - pure CSS animations with intersection observer

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
}

export function FadeIn({ children, className = '', delay = 0, direction = 'up' }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const getAnimationClass = () => {
    switch (direction) {
      case 'up': return 'animate-fade-in-up';
      case 'down': return 'animate-fade-in-up';
      case 'left': return 'animate-slide-in-left';
      case 'right': return 'animate-slide-in-right';
      case 'none': return 'animate-fade-in-scale';
      default: return 'animate-fade-in-up';
    }
  };

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? getAnimationClass() : 'will-animate'}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export function StaggerContainer({ children, className = '', delayChildren = 0 }: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (
        <div className="will-animate" style={{ animationDelay: `${delayChildren}s` }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

export function StaggerItem({ children, className = '', index = 0 }: StaggerItemProps) {
  return (
    <div
      className={`${className} animate-fade-in-up stagger-${Math.min(index + 1, 10)}`}
    >
      {children}
    </div>
  );
}

interface ScaleRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function ScaleReveal({ children, className = '', delay = 0 }: ScaleRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? 'animate-fade-in-scale' : 'will-animate'}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

interface SlideInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  from?: 'left' | 'right';
}

export function SlideIn({ children, className = '', delay = 0, from = 'right' }: SlideInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const animationClass = from === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right';

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? animationClass : 'will-animate'}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CountUp({ end, prefix = '', suffix = '', className = '', style }: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    const duration = 1500;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [hasAnimated, end]);

  return (
    <span ref={ref} className={`counter-value ${className} ${hasAnimated ? 'animate-counter' : ''}`} style={style}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({ children, className = '', onClick }: MagneticButtonProps) {
  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export function TiltCard({ children, className = '' }: TiltCardProps) {
  return <div className={className}>{children}</div>;
}

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return <div className={className}>{children}</div>;
}

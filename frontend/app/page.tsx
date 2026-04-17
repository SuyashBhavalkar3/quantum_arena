// app/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowRight,
  Briefcase,
  Users,
  Brain,
  Mic,
  Video,
  Shield,
  BarChart,
  CheckCircle,
} from "lucide-react";
import homepageAnimation from "@/public/lottie/Human Resources Approval Animation.json";
import Lottie from "lottie-react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function Home() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Load dotLottie web component script */}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background py-20 md:py-32">
        {/* Background mesh */}
        <div className="absolute inset-0 -z-10">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 8 }}
            className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-secondary/30 rounded-full blur-3xl"
          />
        </div>

        <div className="container px-4 md:px-6 mx-auto">
          {/* Grid with centered items */}
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center justify-items-center">
            {/* Left column - Text */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-6 text-center lg:text-left w-full max-w-2xl"
            >
              <motion.div variants={fadeInUp}>
                <Badge className="mb-4" variant="outline">
                  Modern Hiring Platform
                </Badge>
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
              >
                Find the Perfect Candidate with{" "}
                <span className="text-primary">Smart Assessments</span> and{" "}
                <span className="text-primary">Proctored Interviews</span>
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="text-xl text-muted-foreground"
              >
                HRs post jobs, candidates apply, and our platform handles
                compatibility checks, assessments, and proctored voice
                interviews.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" asChild>
                    <Link href="/register?role=hr">
                      For HR <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/register?role=candidate">
                      For Candidates <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/login">
                      Login
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right column - dotLottie Animation */}
            <motion.div
              style={{ y }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative w-full max-w-2xl mx-auto"
            >
              {/* Use the web component directly */}
              <Lottie
                animationData={homepageAnimation}
                loop={true}
                autoplay={true}
                className="w-full h-full"
                style={{ height: "400px", width: "100%" }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center space-y-4 mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold"
            >
              Everything you need in one platform
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground max-w-[800px] mx-auto"
            >
              From job posting to final interview – we streamline the entire
              hiring process.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUp}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-primary/50 group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      {feature.icon}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center space-y-4 mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold"
            >
              How it works
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground max-w-[800px] mx-auto"
            >
              Three simple steps to find your next great hire.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0" />
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUp}
                transition={{ delay: index * 0.2 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-primary/5">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-wrap justify-center gap-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">0+</div>
              <div className="text-muted-foreground">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">0k+</div>
              <div className="text-muted-foreground">Candidates Placed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">0%</div>
              <div className="text-muted-foreground">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Rounds Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center space-y-4 mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold"
            >
              Two Rounds, One Goal
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground max-w-[800px] mx-auto"
            >
              Candidates go through two intelligent rounds to ensure the best
              fit.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {rounds.map((round, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUp}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                  <CardHeader className="bg-primary/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        {round.icon}
                      </div>
                      <div>
                        <CardTitle>{round.title}</CardTitle>
                        <Badge variant="secondary">{round.badge}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-muted-foreground">{round.description}</p>
                    <ul className="space-y-2">
                      {round.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-6 max-w-3xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold"
            >
              Ready to transform your hiring?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl opacity-90">
              Join hundreds of companies using our platform to find the best talent
              faster.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">HireFlow</h3>
              <p className="text-muted-foreground text-sm">
                Comprehensive hiring platform connecting HR with the best
                candidates.
              </p>
            </div>
            {footerLinks.map((column, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4">{column.title}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {column.links.map((link, j) => (
                    <li key={j}>
                      <Link
                        href={link.href}
                        className="hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t mt-12 pt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} HireFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Data arrays (unchanged)
const features = [
  {
    icon: <Briefcase className="h-6 w-6 text-primary" />,
    title: "Post Jobs Instantly",
    description:
      "Create and publish job listings in minutes with our intuitive HR dashboard.",
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Compatibility Check",
    description:
      "Our system automatically matches candidates to jobs based on skills and experience.",
  },
  {
    icon: <BarChart className="h-6 w-6 text-primary" />,
    title: "Smart Assessments",
    description:
      "Generate personalized assessments for each candidate to test relevant skills.",
  },
  {
    icon: <Mic className="h-6 w-6 text-primary" />,
    title: "Voice Interviews",
    description:
      "Conduct automated voice interviews that analyze tone, clarity, and content.",
  },
  {
    icon: <Video className="h-6 w-6 text-primary" />,
    title: "Proctoring & Integrity",
    description:
      "Advanced proctoring ensures fair assessments and interview integrity.",
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Candidate Dashboard",
    description:
      "Candidates track applications, assessments, and interview feedback in one place.",
  },
];

const steps = [
  {
    title: "HR Posts a Job",
    description:
      "Create a detailed job description with required skills and experience.",
  },
  {
    title: "Candidate Applies",
    description:
      "Candidates apply and our system immediately checks compatibility.",
  },
  {
    title: "Interviews & Rounds",
    description:
      "Qualified candidates go through assessments and voice interviews.",
  },
];

const rounds = [
  {
    icon: <Brain className="h-6 w-6 text-primary" />,
    title: "Round 1: Assessment",
    badge: "Skills & Aptitude",
    description:
      "Candidates complete a tailored assessment to demonstrate their technical and problem-solving abilities.",
    features: [
      "Automatically generated questions based on job requirements",
      "Timed tests with anti-cheating measures",
      "Instant scoring and feedback to HR",
    ],
  },
  {
    icon: <Mic className="h-6 w-6 text-primary" />,
    title: "Round 2: Voice Interview",
    badge: "With Proctoring",
    description:
      "An automated interviewer conducts a voice-based conversation to evaluate communication, soft skills, and cultural fit.",
    features: [
      "Natural language processing to assess responses",
      "Real-time proctoring with video and audio monitoring",
      "Detailed report on candidate's performance",
    ],
  },
];

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "For HR", href: "/for-hr" },
      { label: "For Candidates", href: "/for-candidates" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "/security" },
    ],
  },
];

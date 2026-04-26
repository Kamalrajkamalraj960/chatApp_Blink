import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="glass-panel p-10 max-w-lg w-full text-center weightless-hover z-10 relative"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 mx-auto mb-8 rounded-full border-4 border-accent/30 border-t-accent neon-glow"
        />
        <h1 className="text-6xl font-extrabold mb-4 neon-text tracking-tight">Blink</h1>
        <p className="text-slate-300 mb-10 text-lg">
          The future of real-time global messaging. Fast, secure, weightless.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="glass-button px-8 py-3 rounded-full text-white font-medium neon-glow text-lg w-full sm:w-auto">
            Get Started
          </Link>
          <Link to="/login" className="px-8 py-3 rounded-full text-slate-300 font-medium hover:text-white hover:bg-white/5 transition-all duration-300 text-lg w-full sm:w-auto">
            Log In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;

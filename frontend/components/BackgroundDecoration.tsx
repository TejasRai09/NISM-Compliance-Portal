import { motion } from 'framer-motion';

const BackgroundDecoration = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-slate-50">
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: 'linear-gradient(#003366 1px, transparent 1px), linear-gradient(90deg, #003366 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }}
    />
    <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#003366" stopOpacity="0" />
          <stop offset="50%" stopColor="#003366" stopOpacity="1" />
          <stop offset="100%" stopColor="#003366" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[...Array(6)].map((_, i) => (
        <motion.line
          key={`h-${i}`}
          x1="0"
          y1={15 + i * 15 + "%"}
          x2="100%"
          y2={15 + i * 15 + "%"}
          stroke="url(#lineGrad)"
          strokeWidth="1"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 15 + i * 5, repeat: Infinity, ease: 'linear', delay: i * 2 }}
        />
      ))}
    </svg>
  </div>
);

export default BackgroundDecoration;

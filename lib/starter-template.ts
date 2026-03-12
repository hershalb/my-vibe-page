export const STARTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>
    (function(){var w=console.warn;console.warn=function(){if(typeof arguments[0]==='string'&&arguments[0].indexOf('cdn.tailwindcss.com')!==-1)return;w.apply(console,arguments)};})();
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .stars, .stars-2 {
      position: fixed; top: 0; left: 0; width: 200%; height: 200%;
      pointer-events: none; z-index: 0;
    }
    .stars {
      background-image:
        radial-gradient(1px 1px at 50px 80px, rgba(255,255,255,0.6), transparent),
        radial-gradient(1px 1px at 180px 150px, rgba(255,255,255,0.5), transparent),
        radial-gradient(1.5px 1.5px at 320px 60px, rgba(255,255,255,0.7), transparent),
        radial-gradient(1px 1px at 470px 200px, rgba(255,255,255,0.4), transparent),
        radial-gradient(1.2px 1.2px at 600px 30px, rgba(255,255,255,0.55), transparent),
        radial-gradient(1px 1px at 90px 300px, rgba(255,255,255,0.5), transparent),
        radial-gradient(1.5px 1.5px at 250px 400px, rgba(255,255,255,0.65), transparent),
        radial-gradient(1px 1px at 400px 350px, rgba(255,255,255,0.4), transparent),
        radial-gradient(1px 1px at 550px 280px, rgba(255,255,255,0.5), transparent),
        radial-gradient(1.2px 1.2px at 700px 420px, rgba(255,255,255,0.6), transparent),
        radial-gradient(1px 1px at 130px 500px, rgba(255,255,255,0.45), transparent),
        radial-gradient(1.5px 1.5px at 350px 550px, rgba(255,255,255,0.55), transparent),
        radial-gradient(1px 1px at 500px 480px, rgba(255,255,255,0.5), transparent),
        radial-gradient(1.2px 1.2px at 650px 560px, rgba(255,255,255,0.65), transparent),
        radial-gradient(1px 1px at 780px 100px, rgba(255,255,255,0.4), transparent),
        radial-gradient(1px 1px at 820px 340px, rgba(255,255,255,0.55), transparent),
        radial-gradient(1.5px 1.5px at 900px 200px, rgba(255,255,255,0.5), transparent),
        radial-gradient(1px 1px at 50px 620px, rgba(255,255,255,0.45), transparent),
        radial-gradient(1.2px 1.2px at 200px 680px, rgba(255,255,255,0.6), transparent),
        radial-gradient(1px 1px at 450px 700px, rgba(255,255,255,0.5), transparent);
      animation: starDrift 80s linear infinite;
    }
    .stars-2 {
      background-image:
        radial-gradient(1px 1px at 120px 40px, rgba(94,234,212,0.3), transparent),
        radial-gradient(1.5px 1.5px at 300px 120px, rgba(251,191,36,0.25), transparent),
        radial-gradient(1px 1px at 500px 90px, rgba(94,234,212,0.2), transparent),
        radial-gradient(1.2px 1.2px at 680px 250px, rgba(251,191,36,0.3), transparent),
        radial-gradient(1px 1px at 150px 350px, rgba(94,234,212,0.25), transparent),
        radial-gradient(1.5px 1.5px at 400px 450px, rgba(251,191,36,0.2), transparent),
        radial-gradient(1px 1px at 600px 380px, rgba(94,234,212,0.3), transparent),
        radial-gradient(1.2px 1.2px at 750px 500px, rgba(251,191,36,0.25), transparent),
        radial-gradient(1px 1px at 50px 550px, rgba(94,234,212,0.2), transparent),
        radial-gradient(1px 1px at 850px 150px, rgba(251,191,36,0.2), transparent);
      animation: starDrift2 120s linear infinite;
    }
    @keyframes starDrift {
      from { transform: translate(0, 0); }
      to { transform: translate(-50%, -50%); }
    }
    @keyframes starDrift2 {
      from { transform: translate(0, 0); }
      to { transform: translate(-30%, -60%); }
    }
    @keyframes subtlePulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden" style="background: linear-gradient(145deg, #0a0e1a 0%, #111936 40%, #0f172a 70%, #0a0e1a 100%);">
  <div class="stars"></div>
  <div class="stars-2"></div>
  <div class="text-center max-w-md mx-auto w-full relative z-10">
    <h1 class="text-4xl font-semibold tracking-tight bg-gradient-to-r from-teal-300 via-cyan-400 to-amber-300 bg-clip-text text-transparent mb-2">
      vibe page
    </h1>
    <p class="text-slate-400 text-sm mb-8">
      describe anything and watch this page transform
    </p>
    <div id="vibe-chat" class="w-full text-left"></div>
  </div>
</body>
</html>`;

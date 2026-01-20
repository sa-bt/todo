<template>
  <div class="relative w-full aspect-square max-w-[500px] flex items-center justify-center overflow-visible perspective-1000">
    
    <div v-for="(icon, index) in techIcons" :key="index" 
         class="absolute inset-0 flex items-center justify-center animate-orbit pointer-events-none"
         :style="{ 
           animationDuration: icon.duration + 's',
           animationDelay: '-' + icon.delay + 's'
         }">
      <div class="absolute" :style="{ transform: `translateY(-${icon.radius}px)` }">
        <div class="p-2 md:p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl opacity-60 hover:opacity-100 transition-all pointer-events-auto">
          <img :src="icon.url" :alt="icon.name" class="w-6 h-6 md:w-8 md:h-8 object-contain filter drop-shadow-lg">
        </div>
      </div>
    </div>

    <div class="relative z-10 w-[85%] md:w-full max-w-[400px] bg-[#300a24]/95 backdrop-blur-xl rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden transform hover:scale-[1.02] transition-transform">
      <div class="flex items-center justify-between px-4 py-2 bg-[#481439]">
        <div class="flex gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
        </div>
        <span class="text-[10px] text-gray-400 font-mono tracking-tighter">ahmad@ubuntu: ~</span>
      </div>
      
      <div class="p-5 font-mono text-[11px] md:text-[13px] h-[220px] md:h-[260px] text-left ltr overflow-y-auto custom-scrollbar">
        <div class="text-[#87d5a2] mb-2 font-bold">ahmad@ubuntu:~$ <span class="text-white font-normal text-[10px]">php artisan push:test</span></div>
        
        <div class="whitespace-pre-wrap leading-relaxed text-[#fce94f]">
          {{ currentText }}<span class="w-2 h-4 bg-orange-500 animate-pulse inline-block align-middle ml-1"></span>
        </div>

        <div v-if="done" class="mt-4 p-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-[11px] animate-bounce">
           ✓ Broadcast Successful!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentText = ref('')
const done = ref(false)
const phpCode = `<?php
$push = new WebPush();
$push->send([
  'title' => 'Hello Ahmad',
  'body' => 'Success!'
]);`

const techIcons = [
  { name: 'Laravel', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg', radius: 180, duration: 25, delay: 0 },
  { name: 'Vue', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg', radius: 140, duration: 20, delay: 5 },
  { name: 'PHP', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg', radius: 220, duration: 30, delay: 10 },
  { name: 'Tailwind', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg', radius: 110, duration: 15, delay: 2 }
]

const typeWriter = async () => {
  for (let i = 0; i < phpCode.length; i++) {
    currentText.value += phpCode.charAt(i)
    await new Promise(r => setTimeout(r, Math.random() * 40 + 20))
  }
  done.value = true
}

onMounted(() => typeWriter())
</script>

<style scoped>
.animate-orbit { animation: orbit linear infinite; }
@keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.animate-orbit > div { animation: counter-orbit linear infinite; animation-duration: inherit; }
@keyframes counter-orbit { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #481439; }
</style>
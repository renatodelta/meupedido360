'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams, useRouter } from 'next/navigation';
import { Upload, CheckCircle2, Paintbrush, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  // Custom theme colors state
  const [primaryColor, setPrimaryColor] = useState('#E11D48');
  const [secondaryColor, setSecondaryColor] = useState('#1E293B');
  const [backgroundColor, setBackgroundColor] = useState('#F8FAFC');
  const [success, setSuccess] = useState(false);
  const [logMsg, setLogMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial tenant settings
  useEffect(() => {
    async function loadTenant() {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', subdomain)
          .single();

        if (data) {
          setTenant(data);
          setPrimaryColor(data.primary_color || '#E11D48');
          setSecondaryColor(data.secondary_color || '#1E293B');
          setBackgroundColor(data.background_color || '#F8FAFC');
          if (data.logo_url) {
            setLogoPreview(data.logo_url);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar lojista:', err);
      } finally {
        setLoading(false);
      }
    }

    if (subdomain) {
      loadTenant();
    }
  }, [subdomain]);

  // Extract dominant brand colors using canvas pixel analysis
  const analyzeImageColors = (imageSrc: string) => {
    setLogMsg('Analisando logo e extraindo paleta de cores...');
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw image scaled down to 50x50 to average shades and improve performance
      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);

      const imgData = ctx.getImageData(0, 0, 50, 50).data;
      const colorBuckets: { [key: string]: number } = {};

      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];

        // 1. Skip transparent background pixels
        if (a < 120) continue;

        // 2. Skip pure white or pure black background pixels
        if (r > 240 && g > 240 && b > 240) continue;
        if (r < 20 && g < 20 && b < 20) continue;

        // 3. Bucket color channels to nearest multiple of 16 to cluster similar colors
        const buckR = Math.round(r / 16) * 16;
        const buckG = Math.round(g / 16) * 16;
        const buckB = Math.round(b / 16) * 16;

        const key = `${buckR},${buckG},${buckB}`;
        colorBuckets[key] = (colorBuckets[key] || 0) + 1;
      }

      // Sort buckets by pixel occurrences count
      const sorted = Object.entries(colorBuckets).sort((a, b) => b[1] - a[1]);

      if (sorted.length === 0) {
        setLogMsg('Cores predominantes não identificadas (logo monocromático). Mantendo padrão.');
        return;
      }

      const channelToHex = (c: number) => {
        const hex = Math.min(255, Math.max(0, c)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      const rgbToHex = (rgbStr: string) => {
        const [r, g, b] = rgbStr.split(',').map(Number);
        return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
      };

      // Set primary color
      const extractedPrimary = rgbToHex(sorted[0][0]);
      setPrimaryColor(extractedPrimary);

      // Find secondary color (distinct from primary)
      let extractedSecondary = '#1E293B';
      for (let j = 1; j < sorted.length; j++) {
        const candidate = rgbToHex(sorted[j][0]);
        if (candidate !== extractedPrimary) {
          extractedSecondary = candidate;
          break;
        }
      }
      setSecondaryColor(extractedSecondary);
      setLogMsg('Paleta de cores extraída da sua logo com sucesso!');
    };
  };

  // Handle Logo Upload selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);

      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);

      // Run automatic color palette extraction
      analyzeImageColors(objectUrl);
    }
  };

  // Convert File to Base64 (Resilient storage fallback)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Submit setup configuration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setSaving(true);
    setSuccess(false);
    setLogMsg('Salvando configurações...');

    try {
      let finalLogoUrl = logoPreview;

      // 1. Handle file upload to Supabase Storage with local base64 fallback
      if (logoFile) {
        setLogMsg('Enviando logo para o Supabase Storage...');
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${tenant.id}-${Math.random()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        // Attempt bucket upload
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile, { cacheControl: '3600', upsert: true });

        if (uploadError) {
          console.warn('Storage bucket non-existent. Falling back to local Base64 string encoding...');
          setLogMsg('Aviso: Bucket de storage "logos" não configurado. Codificando em Base64...');
          // Fallback to base64 so they can test immediately!
          const b64 = await fileToBase64(logoFile);
          finalLogoUrl = b64;
        } else {
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath);
          finalLogoUrl = publicUrlData.publicUrl;
        }
      }

      // 2. Update database record via secure API route to bypass RLS in demo/setup
      setLogMsg('Atualizando registro da loja via API...');
      const res = await fetch('/api/tenant/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenant.id,
          logo_url: finalLogoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          background_color: backgroundColor,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro na resposta da API');
      }

      setSuccess(true);
      setLogMsg('Configuração salva com sucesso! O visual do seu cardápio foi atualizado.');
      
      // Auto redirect to dynamic menu to view change after 2.5 seconds
      setTimeout(() => {
        router.push(`http://${subdomain}.localhost:3000/`);
      }, 2500);

    } catch (err: any) {
      console.error('Erro ao salvar onboarding:', err);
      setLogMsg(`Erro ao salvar: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        <p className="text-slate-400 text-sm">Carregando painel de setup...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-rose-500">Erro: Loja não encontrada</h1>
        <p className="text-slate-400 mt-2">O subdomínio "{subdomain}" não existe no banco de dados.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Dynamic Background Glow using current state colors */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none opacity-10 blur-[150px] transition-all duration-700 rounded-full"
        style={{
          background: `radial-gradient(circle, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      />

      <div className="max-w-xl mx-auto space-y-8 relative z-10">
        
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
            <Paintbrush className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Setup Visual do Lojista</h1>
          <p className="text-slate-400 text-sm">
            Configure a marca do restaurante **{tenant.name}** (<code className="text-rose-400 font-mono text-xs">{subdomain}.meupedido360.com</code>).
          </p>
        </div>

        {/* Setup card */}
        <form onSubmit={handleSubmit} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl space-y-8 shadow-2xl">
          
          {/* LOGO UPLOAD AREA */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-200">Logo do Restaurante</label>
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/40 hover:border-slate-700 transition-colors duration-200">
              
              {/* Logo Preview */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full bg-slate-900 hover:bg-slate-850 flex items-center justify-center cursor-pointer border border-slate-800 overflow-hidden flex-shrink-0 group relative"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-500 group-hover:text-slate-400 transition" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity duration-200">
                  Alterar
                </div>
              </div>

              {/* Upload controls */}
              <div className="text-center sm:text-left space-y-2 flex-grow">
                <p className="text-xs text-slate-400">Suporta JPG, PNG ou SVG de até 5MB.</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition duration-200"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Selecionar Arquivo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC PALETTE SUGGESTIONS */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-200">Paleta de Cores da Marca</label>
              {logoFile && (
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Gerada Automaticamente
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              
              {/* Primary Color Picker */}
              <div className="space-y-2 p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Primária</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono font-semibold">{primaryColor.toUpperCase()}</span>
                </div>
              </div>

              {/* Secondary Color Picker */}
              <div className="space-y-2 p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Secundária</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono font-semibold">{secondaryColor.toUpperCase()}</span>
                </div>
              </div>

              {/* Background Color Picker */}
              <div className="space-y-2 p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Fundo</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono font-semibold">{backgroundColor.toUpperCase()}</span>
                </div>
              </div>

            </div>
          </div>

          {/* REALTIME SYSTEM LOGS */}
          {logMsg && (
            <div className="p-4 rounded-xl text-xs font-mono bg-slate-950 border border-slate-850 text-slate-300 animate-pulse">
              [SISTEMA] {logMsg}
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Tema salvo com sucesso!</p>
                <p className="text-xs text-slate-300">Você será redirecionado para o seu cardápio digital em segundos para conferir a mudança...</p>
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white transition duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg shadow-rose-500/10"
            style={{
              background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)`
            }}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando Marca...
              </>
            ) : (
              <>
                Salvar Configuração
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}

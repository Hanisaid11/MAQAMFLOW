import math
import struct
import subprocess
import os

SAMPLE_RATE = 22050

def make_biquad_resonator(fc, bw, sr):
    r = math.exp(-math.pi * bw / sr)
    theta = 2.0 * math.pi * fc / sr
    a1 = 2.0 * r * math.cos(theta)
    a2 = -r * r
    gain = 1.0 - r
    return a1, a2, gain

def generate_vocal_phrase(notes_with_durations, output_path):
    # notes_with_durations: [(freq, duration_sec), ...]
    # Total duration
    total_duration = sum(d for _, d in notes_with_durations) + 0.8
    total_samples = int(total_duration * SAMPLE_RATE)
    
    # Precompute pitch envelope across time with smooth glide and vibrato
    pitch_env = []
    current_time = 0.0
    
    for i, (target_f, dur) in enumerate(notes_with_durations):
        num_s = int(dur * SAMPLE_RATE)
        prev_f = notes_with_durations[i-1][0] if i > 0 else target_f
        glide_len = int(min(0.25 * SAMPLE_RATE, num_s * 0.4))
        
        for s in range(num_s):
            t_in_note = s / SAMPLE_RATE
            # Portamento glide
            if s < glide_len:
                alpha = 0.5 * (1.0 - math.cos(math.pi * s / glide_len))
                f = prev_f + (target_f - prev_f) * alpha
            else:
                f = target_f
            
            # Vocal Vibrato (develops after 0.2s of sustain)
            vib_depth = 0.0
            if t_in_note > 0.2:
                vib_depth = min(0.022, (t_in_note - 0.2) * 0.035) # ~25 cents
            vibrato = 1.0 + vib_depth * math.sin(2.0 * math.pi * 5.2 * (current_time + t_in_note))
            
            pitch_env.append(f * vibrato)
        current_time += dur
    
    # Pad release
    last_f = notes_with_durations[-1][0]
    while len(pitch_env) < total_samples:
        pitch_env.append(last_f)
        
    # Generate glottal source excitation
    glottal_samples = [0.0] * total_samples
    phase = 0.0
    
    import random
    random.seed(42)
    
    # Amplitude envelope (natural human vocalise "Aaaaah" with breath in and out)
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        # Envelope: gentle attack, sustain, gentle release
        if t < 0.3:
            env = 0.5 * (1.0 - math.cos(math.pi * t / 0.3))
        elif t > total_duration - 0.7:
            rel_t = (total_duration - t) / 0.7
            env = max(0.0, 0.5 * (1.0 - math.cos(math.pi * max(0.0, rel_t))))
        else:
            env = 1.0
            
        f0 = pitch_env[i]
        phase += f0 / SAMPLE_RATE
        if phase >= 1.0:
            phase -= 1.0
            
        # Rosenberg pulse
        # Open phase = 0.65 of period
        if phase < 0.65:
            # Asymmetric rising then falling
            p = phase / 0.65
            pulse = 3.0 * (p**2) - 2.0 * (p**3)
        else:
            pulse = 0.0
            
        # Aspiration breath noise (vocal friction)
        noise = (random.random() * 2.0 - 1.0) * 0.08
        glottal_samples[i] = (pulse + noise) * env
        
    # Apply 4 Formants for /a:/ (آه)
    formants = [
        (720, 85, 1.0),    # F1
        (1180, 105, 0.65), # F2
        (2550, 140, 0.35), # F3
        (3350, 180, 0.15), # F4
    ]
    
    output = [0.0] * total_samples
    for fc, bw, weight in formants:
        a1, a2, gain = make_biquad_resonator(fc, bw, SAMPLE_RATE)
        y1 = 0.0
        y2 = 0.0
        for i in range(total_samples):
            x = glottal_samples[i] * gain * weight
            y = a1 * y1 + a2 * y2 + x
            y2 = y1
            y1 = y
            output[i] += y
            
    # Normalize peak
    max_val = max(abs(s) for s in output) or 1.0
    scale = 26000.0 / max_val
    
    raw_pcm = bytearray()
    for s in output:
        clamped = max(-32767, min(32767, int(s * scale)))
        raw_pcm.extend(struct.pack('<h', clamped))
        
    # Write to temp raw file and process through ffmpeg with acoustic room reverb
    temp_raw = output_path + '.raw'
    with open(temp_raw, 'wb') as f:
        f.write(raw_pcm)
        
    # FFmpeg: add warm acoustic chamber reverb and convert to high quality mp3
    cmd = [
        'ffmpeg', '-y',
        '-f', 's16le', '-ar', str(SAMPLE_RATE), '-ac', '1', '-i', temp_raw,
        '-af', 'aecho=0.8:0.85:50|100:0.35|0.2,equalizer=f=250:width_type=o:w=1:g=2,equalizer=f=3000:width_type=o:w=1:g=1.5',
        '-codec:a', 'libmp3lame', '-q:a', '2',
        output_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(temp_raw):
        os.remove(temp_raw)
    print(f"Generated: {output_path}")

# Scale Degrees Frequencies for Male Vocalise:
# C3 = 130.81, D3 = 146.83, E½♭3 = 155.56, E♭3 = 155.56 (or ~155), E3 = 164.81
# F3 = 174.61, F#3 = 185.0, G♭3 = 185.0, G3 = 196.0, A♭3 = 207.65, A3 = 220.0
# B½♭3 = 233.08, B♭3 = 233.08, B3 = 246.94, C4 = 261.63, D4 = 293.66

# 1. RAST on C (Majestic, noble, with E½b 350 cents):
# C3 -> D3 -> E½b3 -> F3 -> G3 -> F3 -> E½b3 -> C3
rast_phrase = [
    (130.81, 1.1),
    (146.83, 0.9),
    (159.0,  1.3), # Sikah E½b
    (174.61, 0.9),
    (196.0,  1.4), # Nawa G
    (174.61, 0.8),
    (159.0,  1.1),
    (130.81, 1.8), # Cadence on Rast C
]
generate_vocal_phrase(rast_phrase, "public/audio/ah-haat/rast_human_voice.mp3")

# 2. HIJAZ on D (Mystic, passionate, with augmented second D - Eb - F# - G):
# D3 -> Eb3 -> F#3 -> G3 -> F#3 -> Eb3 -> D3
hijaz_phrase = [
    (146.83, 1.0),
    (155.56, 1.0), # Eb
    (185.0,  1.5), # F# (Augmented 2nd)
    (196.0,  1.3), # G
    (185.0,  0.9), # F#
    (155.56, 1.0), # Eb
    (146.83, 1.8), # Cadence on Dukah D
]
generate_vocal_phrase(hijaz_phrase, "public/audio/ah-haat/hijaz_human_voice.mp3")

# 3. SABA on D (Heartbreaking sorrow with Gb):
# D3 -> E½b3 -> F3 -> Gb3 -> F3 -> E½b3 -> D3
saba_phrase = [
    (146.83, 1.1),
    (159.0,  1.0), # E½b
    (174.61, 1.1), # F
    (185.0,  1.6), # Gb (Flat 4th weeping)
    (174.61, 0.9), # F
    (159.0,  1.1), # E½b
    (146.83, 2.0), # Soft resolving sigh on D
]
generate_vocal_phrase(saba_phrase, "public/audio/ah-haat/saba_human_voice.mp3")

# 4. SIKAH on E½b (Quarter-tone tonic, serene and spiritual):
# E½b3 -> F3 -> G3 -> Ab3 -> G3 -> F3 -> E½b3
sikah_phrase = [
    (159.0,  1.4), # E½b root
    (174.61, 0.9), # F
    (196.0,  1.3), # G
    (207.65, 1.1), # Ab
    (196.0,  1.0), # G
    (174.61, 0.9), # F
    (159.0,  2.0), # Resolution on Sikah E½b
]
generate_vocal_phrase(sikah_phrase, "public/audio/ah-haat/sikah_human_voice.mp3")

# 5. NAHAWAND on C (Velvety, romantic minor):
# C3 -> D3 -> Eb3 -> F3 -> G3 -> Eb3 -> D3 -> C3
nahawand_phrase = [
    (130.81, 1.0),
    (146.83, 0.8),
    (155.56, 1.2), # Eb minor 3rd
    (174.61, 0.9),
    (196.0,  1.4), # G
    (155.56, 1.0), # Eb
    (146.83, 0.8),
    (130.81, 1.8), # Cadence C
]
generate_vocal_phrase(nahawand_phrase, "public/audio/ah-haat/nahawand_human_voice.mp3")

# 6. KURD on D (Warm, tender modern melancholy with semitone D-Eb):
# D3 -> Eb3 -> F3 -> G3 -> F3 -> Eb3 -> D3
kurd_phrase = [
    (146.83, 1.0),
    (155.56, 1.1), # Eb
    (174.61, 1.0), # F
    (196.0,  1.4), # G
    (174.61, 0.9), # F
    (155.56, 1.0), # Eb
    (146.83, 1.9), # Cadence D
]
generate_vocal_phrase(kurd_phrase, "public/audio/ah-haat/kurd_human_voice.mp3")

# 7. AJAM on C (Proud, bright, triumphant major):
# C3 -> D3 -> E3 -> F3 -> G3 -> E3 -> C3
ajam_phrase = [
    (130.81, 1.0),
    (146.83, 0.8),
    (164.81, 1.2), # Natural E major 3rd
    (174.61, 0.9), # F
    (196.0,  1.5), # G
    (164.81, 1.0), # E
    (130.81, 1.9), # Triumphant Cadence C
]
generate_vocal_phrase(ajam_phrase, "public/audio/ah-haat/ajam_human_voice.mp3")

print("All 8 Maqamat Vocal Ah-haat generated successfully!")

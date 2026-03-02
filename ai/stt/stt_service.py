"""
Speech-to-Text Service Abstraction Layer

This module provides an abstract interface for STT services,
allowing easy switching between different providers (Whisper local, API, Google, etc.)
"""

from abc import ABC, abstractmethod
from pathlib import Path


class STTService(ABC):
    """Abstract base class for Speech-to-Text services"""
    
    @abstractmethod
    def transcribe(self, audio_file_path: str) -> dict:
        """
        Transcribe audio file to text
        
        Args:
            audio_file_path: Path to audio/video file
            
        Returns:
            dict with:
                - text: Transcribed text
                - language: Detected language (optional)
                - confidence: Confidence score (optional)
        """
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the name of the STT provider"""
        pass


class WhisperLocalSTT(STTService):
    """
    Local Whisper implementation (FREE)
    Uses OpenAI's open-source Whisper model running locally
    """

    def __init__(self, model_size: str = "small"):   # 🔥 changed from "base" to "small"
        """
        Initialize Whisper STT
        
        Args:
            model_size: Whisper model size (tiny, base, small, medium, large)
        """
        self.model_size = model_size
        self._model = None

    def _load_model(self):
        """Lazy load the Whisper model (loads only when first used)"""
        if self._model is None:
            try:
                import whisper
                print(f"Loading Whisper '{self.model_size}' model...")
                self._model = whisper.load_model(self.model_size)
                print(f"✅ Whisper model loaded successfully")
            except ImportError:
                raise RuntimeError(
                    "Whisper not installed. Install with: pip install openai-whisper"
                )
        return self._model

    def transcribe(self, audio_file_path: str) -> dict:
        """
        Transcribe audio using local Whisper model
        """
        from pathlib import Path
        import numpy as np

        audio_path = Path(audio_file_path)

        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_file_path}")

        model = self._load_model()

        print(f"🎤 Transcribing audio: {audio_path.name} ({audio_path.stat().st_size} bytes)")
        print(f"   Using Whisper model: {self.model_size}")

        try:
            # ===============================
            # WAV FILE HANDLING (no FFmpeg)
            # ===============================
            if audio_path.suffix.lower() in ['.wav', '.wave']:
                from scipy.io import wavfile
                from scipy import signal

                sample_rate, audio_data = wavfile.read(str(audio_path))

                # Convert stereo → mono
                if len(audio_data.shape) > 1:
                    audio_data = audio_data.mean(axis=1)

                # Normalize
                if audio_data.dtype == np.int16:
                    audio_data = audio_data.astype(np.float32) / 32768.0
                elif audio_data.dtype == np.int32:
                    audio_data = audio_data.astype(np.float32) / 2147483648.0

                # Resample to 16kHz
                if sample_rate != 16000:
                    print(f"   Resampling from {sample_rate}Hz to 16000Hz...")
                    num_samples = int(len(audio_data) * 16000 / sample_rate)
                    audio_data = signal.resample(audio_data, num_samples)

                print(f"   Audio loaded: {len(audio_data)/16000:.2f} seconds")

                # 🔥 IMPROVED TRANSCRIPTION SETTINGS
                result = model.transcribe(
                    audio_data,
                    fp16=False,
                    temperature=0,
                    beam_size=5,
                    best_of=5
                )

            # ===============================
            # OTHER FORMATS (requires FFmpeg)
            # ===============================
            else:
                # For other formats, use Whisper's built-in loader (requires FFmpeg)
                result = model.transcribe(
                    audio_path,
                    language="en",
                    fp16=False,
                    temperature=0,
                    verbose=True
            )
            
            return {
                'text': result['text'].strip(),
                'language': result.get('language', 'unknown'),
                'confidence': None
            }

        except Exception as e:
            error_msg = str(e)
            print(f"❌ Whisper transcription failed: {error_msg}")

            if "ffmpeg" in error_msg.lower() or "WinError 2" in error_msg:
                raise RuntimeError(
                    "FFmpeg is required to process this audio format. "
                    "Install FFmpeg and add it to your system PATH."
                )
            else:
                raise RuntimeError(f"Whisper transcription failed: {error_msg}")

    def get_provider_name(self) -> str:
        return f"Whisper Local ({self.model_size})"


class WhisperAPISTT(STTService):
    """
    OpenAI Whisper API implementation (PAID)
    For future use when scaling or need faster processing
    """
    
    def __init__(self, api_key: str = None):
        """
        Initialize Whisper API client
        
        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
        """
        import os
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key required for Whisper API")
    
    def transcribe(self, audio_file_path: str) -> dict:
        """
        Transcribe audio using OpenAI Whisper API
        
        Args:
            audio_file_path: Path to audio file
            
        Returns:
            dict with text and language
        """
        try:
            import openai
            openai.api_key = self.api_key
            
            with open(audio_file_path, 'rb') as audio_file:
                response = openai.Audio.transcribe("whisper-1", audio_file)
            
            return {
                'text': response['text'].strip(),
                'language': response.get('language', 'unknown'),
                'confidence': None
            }
        except ImportError:
            raise RuntimeError("openai package not installed. Install with: pip install openai")
    
    def get_provider_name(self) -> str:
        return "Whisper API (OpenAI)"


# Factory function to get STT service
def get_stt_service(provider: str = "whisper_local", **kwargs) -> STTService:
    """
    Factory function to create STT service instance
    
    Args:
        provider: STT provider name ('whisper_local', 'whisper_api')
        **kwargs: Provider-specific arguments
        
    Returns:
        STTService instance
    """
    providers = {
        'whisper_local': WhisperLocalSTT,
        'whisper_api': WhisperAPISTT,
    }
    
    if provider not in providers:
        raise ValueError(f"Unknown STT provider: {provider}. Available: {list(providers.keys())}")
    
    return providers[provider](**kwargs)

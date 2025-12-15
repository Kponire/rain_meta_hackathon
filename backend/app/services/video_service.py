from typing import Dict, Any, Optional
import yt_dlp
from moviepy import VideoFileClip
import speech_recognition as sr
import tempfile
import os
from app.services.llm_service import LLMService
import logging

logger = logging.getLogger(__name__)

class VideoService:
    """Service for video processing and analysis"""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.recognizer = sr.Recognizer()
    
    async def process_youtube_video(self, url: str) -> Dict[str, Any]:
        """Download and process YouTube video"""
        ydl_opts = {
            'format': 'best[ext=mp4]',
            'outtmpl': '%(id)s.%(ext)s',
            'quiet': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                
                # Process video
                result = await self._process_video_file(filename)
                result["video_info"] = {
                    "title": info.get("title"),
                    "duration": info.get("duration"),
                    "channel": info.get("channel"),
                    "views": info.get("view_count")
                }
                
                # Cleanup
                if os.path.exists(filename):
                    os.remove(filename)
                
                return result
                
        except Exception as e:
            logger.error(f"YouTube processing error: {e}")
            raise
    
    async def process_uploaded_video(self, file_path: str) -> Dict[str, Any]:
        """Process uploaded video file"""
        return await self._process_video_file(file_path)
    
    async def _process_video_file(self, file_path: str) -> Dict[str, Any]:
        """Process video file for transcription and analysis"""
        # Extract audio
        audio_path = await self._extract_audio(file_path)
        
        # Transcribe audio
        transcript = await self._transcribe_audio(audio_path)
        
        # Generate summary using LLM
        summary = await self._generate_summary(transcript)
        
        # Extract key points
        key_points = await self._extract_key_points(transcript)
        
        # Get video duration
        with VideoFileClip(file_path) as video:
            duration = int(video.duration)
        
        # Cleanup audio file
        if os.path.exists(audio_path):
            os.remove(audio_path)
        
        return {
            "transcript": transcript,
            "summary": summary,
            "key_points": key_points,
            "duration": duration,
            "word_count": len(transcript.split())
        }
    
    async def _extract_audio(self, video_path: str) -> str:
        """Extract audio from video file"""
        with VideoFileClip(video_path) as video:
            audio_path = tempfile.mktemp(suffix='.wav')
            video.audio.write_audiofile(audio_path, logger=None)
            return audio_path
    
    async def _transcribe_audio(self, audio_path: str) -> str:
        """Transcribe audio using speech recognition"""
        with sr.AudioFile(audio_path) as source:
            audio_data = self.recognizer.record(source)
            try:
                text = self.recognizer.recognize_google(audio_data)
                return text
            except sr.UnknownValueError:
                return "Could not understand audio"
            except sr.RequestError as e:
                return f"Speech recognition error: {e}"
    
    async def _generate_summary(self, transcript: str, max_length: int = 500) -> str:
        """Generate summary of transcript using LLM"""
        prompt = f"""
        Summarize the following video transcript in {max_length} words or less:
        
        {transcript[:3000]}  # Limit input size
        
        Provide a concise summary highlighting main points.
        """
        
        response = await self.llm_service.llm.ainvoke(prompt)
        return response.content
    
    async def _extract_key_points(self, transcript: str) -> list:
        """Extract key points from transcript"""
        prompt = f"""
        Extract key points from this video transcript:
        
        {transcript[:2000]}
        
        Return as a JSON array of key points, each with:
        - timestamp_estimate (string)
        - point (string)
        - importance (high/medium/low)
        """
        
        try:
            from langchain_core.output_parsers import JsonOutputParser
            parser = JsonOutputParser()
            chain = prompt | self.llm_service.llm | parser
            result = await chain.ainvoke({})
            return result
        except:
            # Fallback to simple extraction
            return ["Key point extraction failed"]
    
    async def explain_video(self, transcript: str, question: str) -> str:
        """Explain video content based on user question"""
        prompt = f"""
        Based on this video transcript, answer the following question:
        
        Transcript: {transcript[:4000]}
        
        Question: {question}
        
        Provide a detailed explanation with timestamps if possible.
        """
        
        response = await self.llm_service.llm.ainvoke(prompt)
        return response.content
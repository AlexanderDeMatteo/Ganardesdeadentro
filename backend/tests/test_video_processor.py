from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.services.video_processor import ProcessResult, VideoProcessor, VideoProcessorError


def _ffprobe_payload(
    *,
    duration: str = '10.5',
    width: int = 1920,
    height: int = 1080,
    size: int = 5_000_000,
) -> str:
    import json

    return json.dumps({
        'streams': [{'width': width, 'height': height, 'duration': duration}],
        'format': {'duration': duration, 'size': str(size)},
    })


class TestVideoProcessor:
    def test_is_video_path(self):
        assert VideoProcessor.is_video_path(Path('demo.mp4')) is True
        assert VideoProcessor.is_video_path(Path('demo.gif')) is False

    def test_probe_returns_metadata(self, tmp_path):
        source = tmp_path / 'clip.mp4'
        source.write_bytes(b'fake')

        with patch('app.services.video_processor.subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(stdout=_ffprobe_payload(), stderr='')
            metadata = VideoProcessor.probe(source)

        assert metadata.duration_seconds == 10.5
        assert metadata.width == 1920
        assert metadata.height == 1080

    def test_process_rejects_long_duration(self, tmp_path):
        source = tmp_path / 'long.mp4'
        source.write_bytes(b'fake')
        output = tmp_path / 'out.mp4'

        with patch('app.services.video_processor.subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                stdout=_ffprobe_payload(duration='120'),
                stderr='',
            )
            with pytest.raises(VideoProcessorError, match='60 segundos'):
                VideoProcessor.process(source, output)

    def test_process_transcodes_and_returns_result(self, tmp_path):
        source = tmp_path / 'input.mp4'
        source.write_bytes(b'fake-input')
        output = tmp_path / 'output.mp4'

        def fake_run(args, **_kwargs):
            if args[0] == 'ffprobe':
                size = len(output.read_bytes()) if output.exists() else 2_000_000
                return MagicMock(stdout=_ffprobe_payload(size=size), stderr='')
            if args[0] == 'ffmpeg':
                output.write_bytes(b'optimized-mp4')
                return MagicMock(stdout='', stderr='')
            raise AssertionError(f'unexpected command: {args}')

        with patch('app.services.video_processor.subprocess.run', side_effect=fake_run):
            result = VideoProcessor.process(source, output)

        assert result.was_transcoded is True
        assert result.output_path == output
        assert result.size_bytes == len(b'optimized-mp4')
        assert output.read_bytes() == b'optimized-mp4'

    def test_process_retries_when_first_output_too_large(self, tmp_path):
        source = tmp_path / 'input.mp4'
        source.write_bytes(b'fake-input')
        output = tmp_path / 'output.mp4'
        sizes = iter([12_000_000, 4_000_000])

        def fake_run(args, **_kwargs):
            if args[0] == 'ffprobe':
                size = next(sizes, 4_000_000)
                return MagicMock(stdout=_ffprobe_payload(size=size), stderr='')
            if args[0] == 'ffmpeg':
                output.write_bytes(b'x' * 4_000_000)
                return MagicMock(stdout='', stderr='')
            raise AssertionError(f'unexpected command: {args}')

        with patch('app.services.video_processor.subprocess.run', side_effect=fake_run):
            result = VideoProcessor.process(source, output)

        assert result.was_transcoded is True
        assert result.size_bytes == 4_000_000

    def test_process_fails_when_optimized_still_too_large(self, tmp_path):
        source = tmp_path / 'input.mp4'
        source.write_bytes(b'fake-input')
        output = tmp_path / 'output.mp4'

        def fake_run(args, **_kwargs):
            if args[0] == 'ffprobe':
                return MagicMock(stdout=_ffprobe_payload(size=12_000_000), stderr='')
            if args[0] == 'ffmpeg':
                output.write_bytes(b'x' * 12_000_000)
                return MagicMock(stdout='', stderr='')
            raise AssertionError(f'unexpected command: {args}')

        with patch('app.services.video_processor.subprocess.run', side_effect=fake_run):
            with pytest.raises(VideoProcessorError, match='demasiado grande'):
                VideoProcessor.process(source, output)

        assert not output.exists()

    def test_process_without_transcode_copies_file(self, tmp_path, monkeypatch):
        monkeypatch.setattr(
            'app.services.video_processor.config.EXERCISE_MEDIA_TRANSCODE_ENABLED',
            False,
        )
        source = tmp_path / 'input.mp4'
        source.write_bytes(b'raw-video')
        output = tmp_path / 'output.mp4'

        with patch('app.services.video_processor.subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                stdout=_ffprobe_payload(size=len(b'raw-video')),
                stderr='',
            )
            result = VideoProcessor.process(source, output)

        assert result.was_transcoded is False
        assert output.read_bytes() == b'raw-video'

    def test_process_without_transcode_rejects_large_file(self, tmp_path, monkeypatch):
        monkeypatch.setattr(
            'app.services.video_processor.config.EXERCISE_MEDIA_TRANSCODE_ENABLED',
            False,
        )
        monkeypatch.setattr('app.services.video_processor.config.EXERCISE_MEDIA_MAX_BYTES', 10)
        source = tmp_path / 'input.mp4'
        source.write_bytes(b'x' * 20)
        output = tmp_path / 'output.mp4'

        with patch('app.services.video_processor.subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                stdout=_ffprobe_payload(size=20, duration='5'),
                stderr='',
            )
            with pytest.raises(VideoProcessorError, match='demasiado grande'):
                VideoProcessor.process(source, output)

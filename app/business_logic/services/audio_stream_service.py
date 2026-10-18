from collections.abc import Iterator
from pathlib import Path


class InvalidByteRange(ValueError):
    pass


def parse_byte_range(header: str, file_size: int) -> tuple[int, int]:
    if not header.startswith("bytes=") or "," in header or file_size <= 0:
        raise InvalidByteRange("Byte range is not satisfiable")
    value = header.removeprefix("bytes=").strip()
    start_text, separator, end_text = value.partition("-")
    if not separator:
        raise InvalidByteRange("Byte range is not satisfiable")
    try:
        if not start_text:
            suffix_length = int(end_text)
            if suffix_length <= 0:
                raise InvalidByteRange("Byte range is not satisfiable")
            start = max(file_size - suffix_length, 0)
            end = file_size - 1
        else:
            start = int(start_text)
            end = int(end_text) if end_text else file_size - 1
    except ValueError as error:
        raise InvalidByteRange("Byte range is not satisfiable") from error
    if start < 0 or start >= file_size or end < start:
        raise InvalidByteRange("Byte range is not satisfiable")
    return start, min(end, file_size - 1)


def stream_file_range(path: Path, start: int, length: int) -> Iterator[bytes]:
    with path.open("rb") as audio_file:
        audio_file.seek(start)
        remaining = length
        while remaining:
            chunk = audio_file.read(min(64 * 1024, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk

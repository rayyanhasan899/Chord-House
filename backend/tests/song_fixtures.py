"""Original silent MPEG frames for transport/HTML media checks, not speaker tests."""


def silent_mp3() -> bytes:
    return (bytes.fromhex("fffb9000") + bytes(413)) * 600

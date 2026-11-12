"""Original 16-second silence, encoded with FFmpeg/libmp3lame (imageio-ffmpeg 0.8.1).

The Xing seek/duration metadata matters: hand-built zero frames did not provide
reliable WebKit endpoint seeking. This is generated silence, not song content.
No encoder package is needed to run tests and no new application dependency.
SHA-256: a6503c0e6e33e7c2efe9646797efe4121106ca2a2a1366e0992469fe70c62fc9
"""

import base64
import zlib

_SILENCE = (
    "eNrt2m9k1HEcwPHvupMmrUTGRFcb/ZFr185IpNSx2cbZ+omUnHLK0oqMRMZEIhEViSwzm0ikB4kcXSQS"
    "ifQgkUgkEjPOrN/2pOxBMdJ1Xp8nX78Hv9/v+3rwefbu3NOWDLOzbm9fXy4+G0JIdBcGi+1t6Uw607o1"
    "/JyZSr4U5k/nieJAfCwPYVEx1E3Wh8TiJUuXrVi5qrFp9Zq1Les3bd6SybZv275j5+5cR1dPvjfat//A"
    "ocKR4rH+gVOnB8+cPTc0fP7CxUuXr1y9fuPmrZHRsYk7d+/df/Dw0ePSk6fPnr94+er1m7fv3n/4+Onz"
    "l6/fvk9OVaZn/xvf8fDcHX+9TEtyaO6M73Gta7w5/H5iTzkkSqFuNH5IhZCNX0527+rJZdOZ1IbC8ZNH"
    "C6nWjdGfZyHv/IWZqfSWDw7P8yzoS1UEGgECAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC"
    "AvpvQVXiqUVQvnw7UTsgKwQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBCSXi/R/VggI"
    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhI/6f/s0JAQEBAQEBAQEBAQEBAQEBAQEBA"
    "QEBAQEBAQEBAQEBAQEBAQECR/g9I/2eFgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA"
    "5HKR/k//BwQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBKT/0/9ZISAgICAgICAgICAg"
    "ICAgICAgICAgICAgICAgICAgICAgICAgoEj/p//T/1khICAgICAgICAgICAgICAgICAgICAgICAgICAg"
    "ICAgICAgICAguRyQ/g8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhI/6f/s0JAQEBA"
    "QEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBA+j/9nxUCAgICAgICAgICAgICAgICAgICAgIC"
    "AgICAgICAgICAgICAgKSywHp/4CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0f/o/"
    "KwQEBAQEBAQEBAQEBAQEBAQEBPSPQVUyNQf6AXPpnCQ="
)


def silent_mp3() -> bytes:
    return zlib.decompress(base64.b64decode(_SILENCE))

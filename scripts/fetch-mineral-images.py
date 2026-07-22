#!/usr/bin/env python3
"""Fetch, normalize and document licensed mineral images used by CrystalAR.

The source URLs and licenses are intentionally explicit. Images are resized and
cropped for educational cards; the original source pages remain recorded in the
manifest and IMAGE_CREDITS.md.
"""

from __future__ import annotations

import hashlib
import json
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "minerals"
SIZE = (900, 900)
USER_AGENT = "CrystalAR/5.3.2 educational image sync (https://github.com/arigony/CrystalAR)"

IMAGES = [
    {
        "key": "diamond",
        "filename": "diamond.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Diamond-diamond_macle1.jpg",
        "source_page": "https://commons.wikimedia.org/wiki/File:Diamond-diamond_macle1.jpg",
        "author": "Rob Lavinsky, iRocks.com",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "description": "Diamante natural maclado (macle), triangular, transparente, 9,94 ct, 1,5 × 1,5 × 0,4 cm, África do Sul.",
        "crop": "square-center",
    },
    {
        "key": "graphite",
        "filename": "graphite.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/3d/Graphite-233436.jpg",
        "source_page": "https://commons.wikimedia.org/wiki/File:Graphite-233436.jpg",
        "author": "Rob Lavinsky, iRocks.com",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "description": "Massa natural de grafite cinza-aço com forma lamelar e aspecto foliado.",
        "crop": "square-center",
    },
    {
        "key": "rutile",
        "filename": "rutile.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Rutile-ww7c.jpg",
        "source_page": "https://commons.wikimedia.org/wiki/File:Rutile-ww7c.jpg",
        "author": "Rob Lavinsky, iRocks.com",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "description": "Rutilo reticulado, com cristais estriados vermelho-escuros; Diamantina, Minas Gerais, Brasil.",
        "crop": "square-center",
    },
    {
        "key": "anatase",
        "filename": "anatase.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e3/Anat%C3%A1sio.jpeg",
        "source_page": "https://commons.wikimedia.org/wiki/File:Anat%C3%A1sio.jpeg",
        "author": "Tom Epaminondas e Eurico Zimbres",
        "license": "CC BY-SA 2.0 BR",
        "license_url": "https://creativecommons.org/licenses/by-sa/2.0/br/",
        "description": "Cristais castanhos de anatásio; Gouveia, Minas Gerais, Brasil.",
        "crop": "square-center",
    },
    {
        "key": "brookite",
        "filename": "brookite.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Brookite.jpg",
        "source_page": "https://commons.wikimedia.org/wiki/File:Brookite.jpg",
        "author": "Assianir",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "description": "Exemplar de brookita, com hábito tabular/lamelar visível.",
        "crop": "square-center",
    },
    {
        "key": "calcite",
        "filename": "calcite.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e6/Calcite_5.jpg",
        "source_page": "https://commons.wikimedia.org/wiki/File:Calcite_5.jpg",
        "author": "Parent Géry",
        "license": "Domínio público",
        "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
        "description": "Romboedros de calcita, escolhidos para evidenciar o hábito cristalino característico.",
        "crop": "square-center",
    },
    {
        "key": "aragonite",
        "filename": "aragonite.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Aragonite-23204.jpg",
        "source_page": "https://commons.wikimedia.org/wiki/File:Aragonite-23204.jpg",
        "author": "Rob Lavinsky, iRocks.com",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "description": "Agregados radiais tridimensionais de aragonita; Nevada, EUA.",
        "crop": "square-center",
    },
    {
        "key": "vaterite",
        "filename": "vaterite.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/90/Vaterite_Spheres_SEM.jpg",
        "source_page": "https://commons.wikimedia.org/wiki/File:Vaterite_Spheres_SEM.jpg",
        "author": "A. Di Falco",
        "license": "CC BY 3.0",
        "license_url": "https://creativecommons.org/licenses/by/3.0/",
        "description": "Micrografia eletrônica de esferas de vaterita; a imagem não representa uma amostra macroscópica.",
        "crop": "SEM panel c, then square",
    },
]


def download(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=60) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status} while fetching {url}")
        return response.read()


def prepare_image(raw: bytes, key: str) -> Image.Image:
    with Image.open(BytesIO(raw)) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")

    if key == "vaterite":
        # Use the lower-left SEM panel (c), which shows one complete sphere and
        # retains its scale bar. The source is a four-panel scientific figure.
        width, height = image.size
        image = image.crop((0, height // 2, width // 2, height))

    return ImageOps.fit(image, SIZE, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, object]] = []

    for entry in IMAGES:
        raw = download(entry["url"])
        source_sha256 = hashlib.sha256(raw).hexdigest()
        image = prepare_image(raw, entry["key"])
        destination = OUTPUT / entry["filename"]
        image.save(destination, "JPEG", quality=88, optimize=True, progressive=True)
        processed_sha256 = hashlib.sha256(destination.read_bytes()).hexdigest()

        manifest.append(
            {
                **entry,
                "output": str(destination.relative_to(ROOT)).replace("\\", "/"),
                "output_size": list(image.size),
                "source_sha256": source_sha256,
                "processed_sha256": processed_sha256,
                "modifications": "Recorte central, redimensionamento para 900 × 900 px e compressão JPEG."
                if entry["key"] != "vaterite"
                else "Recorte do painel c da micrografia, recorte quadrado, redimensionamento para 900 × 900 px e compressão JPEG.",
            }
        )
        print(f"saved {destination.relative_to(ROOT)}")

    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

# CTA-608 test fixtures

## `608_av1.mp4`

A real, decodable AV1 fragmented mp4 with CTA-608 captions in `metadata_itu_t_t35` OBUs:
256x144, 30 fps, 40 frames, Main profile (`av01.0.00M.08`), one fragment.

The caption is `HELLO WORLD` as a pop-on on row 15, with each control code doubled.
Frames 0-13 contain 14 field 1 byte pairs. Frames 30-31 contain `EDM`. One pair per frame
is what an SCC source specifies.

Regenerate in two steps. First, encode the clean AV1 bitstream with `+bitexact` for a
byte-reproducible encode:

```sh
ffmpeg -y -fflags +bitexact -f lavfi -i "testsrc2=size=256x144:rate=30" -frames:v 40 \
  -c:v libsvtav1 -preset 8 -crf 63 -pix_fmt yuv420p \
  -svtav1-params "pred-struct=1:lookahead=0" \
  -flags:v +bitexact -map_metadata -1 \
  -movflags +frag_keyframe+empty_moov+default_base_moof+skip_trailer \
  av01-clean.mp4
```

Then inject the captions with [go-608](https://github.com/Eyevinn/go-608). go-608 is
independent, so these fixtures do not re-encode this library's own assumptions:

```sh
cat > hello.scc <<'EOF'
Scenarist_SCC V1.0

00:00:00:00	9420 9420 94ae 94ae 94e0 94e0 c845 4c4c 4f20 574f 524c c480 942f 942f

00:00:01:00	942c 942c
EOF

go608-inject -i av01-clean.mp4 -sub hello.scc -o 608_av1.mp4 -fps 30
```

`go608-info -i 608_av1.mp4` prints the per-frame field pairs and the rendered screen.
`go608-extract` reads the captions back as WebVTT.

## `608_h264.m4s` and `608_h265.m4s`

Pre-existing fixtures with captions in `itu_t_t35` SEI messages, on both fields. One frame's
`cc_data()` packs all byte pairs of a caption.
Their provenance is not recorded.

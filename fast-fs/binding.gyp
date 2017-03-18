{
  "targets": [
    {
      "target_name": "fast-fs",
      "sources": [ "fast-fs.cc" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}
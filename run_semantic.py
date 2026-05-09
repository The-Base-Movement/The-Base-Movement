import json
from pathlib import Path
from graphify.llm import extract_corpus_parallel

uncached = Path('graphify-out/.graphify_uncached.txt').read_text().strip().splitlines()
code_exts = {'.ts','.tsx','.js','.jsx','.py','.go','.rs','.java','.cpp','.c','.rb','.swift','.kt','.cs','.php','.sql','.mjs','.cjs','.vue','.svelte'}
non_code = [f for f in uncached if Path(f).suffix.lower() not in code_exts]

print(f"Extracting semantically for {len(non_code)} non-code files using Gemini backend.")
if non_code:
    path_objects = [Path(f) for f in non_code]
    result = extract_corpus_parallel(path_objects, backend='gemini')
    Path('graphify-out/.graphify_semantic_new.json').write_text(json.dumps(result, indent=2))
    print(f"Got {len(result.get('nodes',[]))} nodes, {len(result.get('edges',[]))} edges")
else:
    Path('graphify-out/.graphify_semantic_new.json').write_text(json.dumps({'nodes':[], 'edges':[], 'hyperedges':[]}))

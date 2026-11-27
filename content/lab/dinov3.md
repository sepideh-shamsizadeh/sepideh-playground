## Overview

A mobile robot needs a way to tell whether two views contain the same surface or object as its camera moves. This lab asks whether dense DINOv3 descriptors can help match corresponding patches when viewpoint or lighting changes.

The mini-project uses a small set of indoor image pairs. The aim is to extract a feature map, inspect individual correspondences, and identify situations where a confident-looking match is wrong.

## Implementation

A vision transformer splits an image into patches and represents each patch with a feature vector. Nearby patches in feature space need not sit next to each other in the original image. For matching, keep the spatial layout so each descriptor can be traced back to its patch.

### Compare normalized descriptors

For feature vectors $a$ and $b$, cosine similarity measures the agreement in direction.

$$
s(a,b) = \frac{a \cdot b}{\lVert a \rVert_2\,\lVert b \rVert_2}
$$

The following Python helper demonstrates the comparison step. It assumes that feature extraction and patch indexing have already been handled.

```python
import torch.nn.functional as F

def patch_similarity(query, candidates):
    query = F.normalize(query, dim=-1)
    candidates = F.normalize(candidates, dim=-1)
    return query @ candidates.transpose(-2, -1)
```

Use the upstream DINOv3 repository for the reference model and preprocessing. Record the checkpoint, image size, device and library versions when the experiment runs.

## Experiments and Evaluation

Start with manually checked correspondences. Separate pairs by viewpoint and illumination, and compare nearest patch matches against a simple normalized RGB patch baseline.

| Measure | What to record |
| --- | --- |
| Match accuracy | Fraction of selected matches that fall inside the defined ground-truth tolerance |
| Failure cases | Repeated textures, occlusions, low light and large changes in viewpoint |
| Runtime | Feature extraction and matching time, reported separately on the test hardware |

Results and engineering hours will be added after the experiment has been run.

## Robotics Applications

Dense descriptors could help a robot recognize a surface seen from a new pose or find correspondences for visual localization. Before considering a TISHTAR integration, assess stability under motion blur and report the compute cost on the intended hardware.

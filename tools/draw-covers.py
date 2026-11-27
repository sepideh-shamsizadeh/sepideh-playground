"""Render original explanatory cover diagrams. Requires Pillow and no datasets."""

import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1200, 675
INK = "#12263b"
SUB = "#3b586b"
BLUE = "#d9eaf1"
LINE = "#b9d6e0"
TEAL = "#087d71"
ORANGE = "#a64d31"
PALE = "#eaf3f6"

# A teaching diagram for each topic. Labels and geometry are illustrative, not measured data.
CONCEPTS = {
    "lab": ("Applied AI & Robotics Lab", "Research and engineering workflow", ("Perceive", "Estimate", "Plan"), "robot"),
    "dinov3": ("DINOv3", "Dense visual features", ("Image patches", "Feature encoder", "Patch descriptors"), "patches"),
    "kalman-filter": ("Kalman filter", "Prediction and correction", ("Predict state", "Observe", "Correct state"), "curves"),
    "clip": ("CLIP", "Image and text in a shared space", ("Image encoder", "Shared space", "Text encoder"), "embeddings"),
    "gazebo-turtlebot3": ("Gazebo & TurtleBot3", "Robot simulation", ("Robot model", "Simulated world", "Sensor topics"), "robot"),
    "sam-2": ("SAM 2", "Prompt-guided segmentation", ("Prompt", "Image encoder", "Object mask"), "mask"),
    "extended-kalman-filter": ("Extended Kalman filter", "Local linearization", ("Nonlinear model", "Jacobian", "State update"), "curves"),
    "depth-anything-v2": ("Depth Anything V2", "Relative depth from one image", ("RGB frame", "Depth model", "Relative depth"), "depth"),
    "sensor-fusion": ("Sensor fusion", "Align observations in time", ("IMU", "Fusion", "Wheel odometry"), "signals"),
    "detr": ("DETR", "Object queries and predictions", ("Image features", "Object queries", "Set of boxes"), "boxes"),
    "icp": ("ICP", "Point cloud alignment", ("Source cloud", "Correspondences", "Rigid transform"), "cloud"),
    "onnx": ("ONNX", "Portable inference graph", ("Train model", "Export graph", "Run inference"), "graph"),
    "slam": ("SLAM", "Map and pose together", ("Measurements", "Pose graph", "Map estimate"), "graph"),
    "tensorrt": ("TensorRT", "Optimize an inference graph", ("ONNX graph", "Optimize", "Inference engine"), "graph"),
    "amcl": ("AMCL", "Localization with particles", ("Predict particles", "Weight samples", "Resample"), "cloud"),
    "quantization": ("Quantization", "Map values onto discrete levels", ("Float values", "Scale and round", "Integer levels"), "signals"),
    "nav2-path-planning": ("Nav2 & path planning", "Navigate a costmap", ("Global path", "Local control", "Goal"), "robot"),
}


def font(size):
    return ImageFont.load_default(size=size)


def draw_cover(slug, definition):
    title, subtitle, steps, kind = definition
    image = Image.new("RGB", (WIDTH, HEIGHT), PALE)
    draw = ImageDraw.Draw(image)
    for x in range(40, WIDTH, 40):
        draw.line((x, 180, x, 490), fill="#e2edf0")
    for y in range(190, 490, 40):
        draw.line((40, y, 1160, y), fill="#e2edf0")
    draw.text((65, 48), title, fill=INK, font=font(50))
    draw.text((68, 114), subtitle, fill=SUB, font=font(24))
    draw.rounded_rectangle((78, 184, 1122, 490), radius=22, fill="#f8fcfd", outline=LINE, width=2)

    if kind in ("patches", "boxes", "mask", "depth"):
        for row in range(5):
            for col in range(10):
                x, y = 180 + col * 47, 223 + row * 46
                active = (col + row) % 4 == 0 or (3 <= col <= 6 and 1 <= row <= 3)
                color = ("#a8d6d2" if active else BLUE)
                if kind == "depth":
                    color = ["#dceff3", "#b8dce8", "#8fc6d8", "#62a9bd", "#348ba1"][row]
                draw.rounded_rectangle((x, y, x + 43, y + 42), radius=3, fill=color, outline="#ffffff")
        if kind == "boxes":
            draw.rectangle((310, 252, 494, 404), outline=ORANGE, width=4)
        if kind == "mask":
            draw.ellipse((286, 270, 448, 395), fill="#89cfc3", outline=TEAL, width=4)
        for n in range(6):
            x, y = 735 + (n % 3) * 85, 255 + (n // 3) * 93
            draw.rounded_rectangle((x, y, x + 65, y + 58), radius=7, fill=BLUE if n % 2 else "#97cfc7")
        draw.line((664, 337, 714, 337), fill=TEAL, width=4)
        draw.polygon([(714, 337), (699, 329), (699, 345)], fill=TEAL)
    elif kind in ("curves", "signals"):
        for x in range(185, 1026, 84):
            draw.line((x, 226, x, 445), fill=LINE)
        for y in range(226, 446, 44):
            draw.line((185, y, 1025, y), fill=LINE)
        points = [(185+i*84, y) for i,y in enumerate((410,390,365,382,322,303,312,266,250,271,237))]
        if slug == "quantization":
            for a,b in zip(points,points[1:]):
                draw.line((a,(b[0],a[1]),b),fill=TEAL,width=5)
        else:
            draw.line(points,fill=TEAL,width=5,joint="curve")
        for i,(x,y) in enumerate(points):
            dy = (i % 3 - 1) * 23
            draw.ellipse((x-7,y+dy-7,x+7,y+dy+7), fill="#f8fcfd", outline=ORANGE, width=3)
    elif kind == "robot":
        for x in range(185, 1050, 54): draw.line((x, 220, x, 455), fill=LINE)
        for y in range(220, 470, 39): draw.line((185, y, 1038, y), fill=LINE)
        for x,y in [(400,259),(454,259),(508,259),(720,376),(777,376)]:
            draw.rounded_rectangle((x,y,x+47,y+35), radius=3, fill="#a6bdc8")
        route=[(218,414),(354,414),(354,332),(595,332),(595,254),(983,254)]
        draw.line(route, fill=TEAL, width=6)
        for x,y in (route[0],route[-1]): draw.ellipse((x-13,y-13,x+13,y+13),fill="#f8fcfd",outline=ORANGE,width=4)
        draw.polygon([(604,332),(590,323),(590,341)],fill=TEAL)
    else:
        groups = [(330,323),(594,352),(872,298)]
        if kind == "cloud": groups = [(473,331),(572,353),(676,319)]
        colors = [TEAL, "#548cad", ORANGE]
        for i,(x,y) in enumerate(groups):
            for j in range(12):
                dx,dy=(j*43)%172-85,(j*71)%150-70
                draw.ellipse((x+dx-6,y+dy-6,x+dx+6,y+dy+6), fill=colors[i])
            if i < len(groups)-1:
                x2,y2=groups[i+1]
                draw.line((x,y,x2,y2),fill="#7faebb",width=3)
            draw.ellipse((x-12,y-12,x+12,y+12),fill="#f8fcfd",outline=colors[i],width=4)

    for index, step in enumerate(steps):
        x=78 + 348*index
        draw.rounded_rectangle((x, 525, x+322, 607), radius=11, fill="#f8fcfd", outline=LINE, width=2)
        draw.text((x+18, 551), step, fill=INK, font=font(23))
    draw.text((78, 628), "Conceptual illustration", fill=SUB, font=font(20))
    image.save(Path("src/assets/covers") / (slug + ".webp"), "WEBP", quality=83, method=6)


if __name__ == "__main__":
    slugs = {row["slug"] for row in json.loads(Path("data/experiments.json").read_text())}
    assert slugs == CONCEPTS.keys() - {"lab"}
    for name, concept in CONCEPTS.items():
        draw_cover(name, concept)

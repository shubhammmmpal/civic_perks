import MagicRouteVibeList from "../model/magicRouteVibeList.model.js";

export const seedMagicRouteVibes = async (req, res) => {
  try {
    const data = [
      {
        category: "Culinary & Nightlife",
        subCategories: [
          { name: "The Roaster's Circuit", icon: "☕" },
          { name: "Street Food Safari", icon: "🌮" },
          { name: "The Dive Bar Crawl", icon: "🍺" },
          { name: "The Sweet Tooth Run", icon: "🧁" }
        ]
      },
      {
        category: "Art & Architecture",
        subCategories: [
          { name: "The Urban Canvas", icon: "🎨" },
          { name: "Concrete Giants", icon: "🏢" },
          { name: "The Neon Glow", icon: "💡" },
          { name: "Hidden Sculptures", icon: "🗿" }
        ]
      },
      {
        category: "History & Lore",
        subCategories: [
          { name: "The Phantom Tour", icon: "👻" },
          { name: "The Old Town Path", icon: "🏰" },
          { name: "The Industrial Echo", icon: "🏭" },
          { name: "Forgotten Plaques", icon: "🏛️" }
        ]
      },
      {
        category: "Scenic & Nature",
        subCategories: [
          { name: "The High Ground Hunt", icon: "🔭" },
          { name: "Secret Courtyards", icon: "⛲" },
          { name: "The Waterfront Walk", icon: "🌊" },
          { name: "The Old Growth Trail", icon: "🌳" }
        ]
      },
      {
        category: "Lifestyle & Social",
        subCategories: [
          { name: "First Date Blueprint", icon: "🍷" },
          { name: "Thrift & Vintage Run", icon: "🛍️" },
          { name: "The Golden Hour", icon: "📸" },
          { name: "Urban Calisthenics", icon: "🏃" }
        ]
      }
    ];

    await MagicRouteVibeList.deleteMany({});
    await MagicRouteVibeList.insertMany(data);

    res.status(201).json({
      success: true,
      message: "Magic Route Vibes seeded successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const getMagicRouteVibes = async (req, res) => {
  try {
    const vibes = await MagicRouteVibeList.find();

    res.status(200).json({
      success: true,
      count: vibes.length,
      data: vibes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getMagicRouteVibeById = async (req, res) => {
  try {
    const vibe = await MagicRouteVibeList.findById(req.params.id);

    if (!vibe) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    res.status(200).json({
      success: true,
      data: vibe
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
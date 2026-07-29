/**
 * Unsplash Image Service
 * Provides high-quality images for case study templates
 */

export interface UnsplashImageOptions {
  width?: number;
  height?: number;
  query?: string;
  featured?: boolean;
}

/**
 * Get Unsplash image URL using the Source API (no auth required)
 * https://source.unsplash.com/
 */
export function getUnsplashImage(options: UnsplashImageOptions = {}): string {
  const {
    width = 1600,
    height = 900,
    query = "business,technology,design",
    featured = true,
  } = options;

  if (query) {
    // Search by query
    return `https://source.unsplash.com/${featured ? "featured/" : ""}${width}x${height}/?${query}`;
  }

  // Random image
  return `https://source.unsplash.com/${featured ? "featured/" : ""}${width}x${height}/`;
}

/**
 * Get themed images for different case study sections
 */
export const unsplashThemes = {
  hero: (seed?: string) =>
    `https://source.unsplash.com/featured/1920x1080/?business,office,workspace${seed ? `&sig=${seed}` : ""}`,
  
  challenge: (seed?: string) =>
    `https://source.unsplash.com/featured/1600x900/?problem,planning,strategy${seed ? `&sig=${seed}` : ""}`,
  
  solution: (seed?: string) =>
    `https://source.unsplash.com/featured/1600x900/?solution,technology,innovation${seed ? `&sig=${seed}` : ""}`,
  
  design: (seed?: string) =>
    `https://source.unsplash.com/featured/1600x900/?design,ui,interface${seed ? `&sig=${seed}` : ""}`,
  
  team: (seed?: string) =>
    `https://source.unsplash.com/featured/1600x900/?team,collaboration,meeting${seed ? `&sig=${seed}` : ""}`,
  
  results: (seed?: string) =>
    `https://source.unsplash.com/featured/1600x900/?success,growth,analytics${seed ? `&sig=${seed}` : ""}`,
  
  process: (seed?: string) =>
    `https://source.unsplash.com/featured/1600x900/?workflow,development,coding${seed ? `&sig=${seed}` : ""}`,
  
  mobile: (seed?: string) =>
    `https://source.unsplash.com/featured/1600x900/?mobile,phone,app${seed ? `&sig=${seed}` : ""}`,
  
  web: (seed?: string) =>
    `https://source.unsplash.com/featured/1600x900/?website,laptop,screen${seed ? `&sig=${seed}` : ""}`,
  
  abstract: (seed?: string) =>
    `https://source.unsplash.com/featured/1600x900/?abstract,minimal,pattern${seed ? `&sig=${seed}` : ""}`,
};

/**
 * Generate consistent images for a project using seed
 */
export function getProjectImages(projectId: string) {
  return {
    hero: unsplashThemes.hero(projectId),
    challenge: unsplashThemes.challenge(projectId),
    solution: unsplashThemes.solution(projectId),
    design: unsplashThemes.design(projectId),
    team: unsplashThemes.team(projectId),
    results: unsplashThemes.results(projectId),
    process: unsplashThemes.process(projectId),
  };
}

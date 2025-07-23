import { existsSync, promises as fs } from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';

const components = [
  {
    name: 'upload-button',
    dependencies: ['better-upload', 'lucide-react'],
    registryDependencies: ['button'],
  },
  {
    name: 'upload-dropzone',
    dependencies: ['better-upload', 'lucide-react', 'react-dropzone'],
    registryDependencies: [],
  },
  {
    name: 'upload-dropzone-progress',
    dependencies: ['better-upload', 'lucide-react', 'react-dropzone'],
    registryDependencies: ['progress'],
  },
];

const REGISTRY_PATH = path.join(process.cwd(), 'public/r');

async function buildRegistry() {
  await rimraf(REGISTRY_PATH);

  for (const component of components) {
    const code = await fs.readFile(
      path.join(process.cwd(), `components/templates/${component.name}.txt`),
      'utf-8'
    );

    const entry = {
      name: component.name,
      type: 'registry:ui',
      dependencies: component.dependencies,
      registryDependencies: component.registryDependencies,
      files: [
        {
          path: `${component.name}.tsx`,
          content: code,
          type: 'registry:ui',
          target: '',
        },
      ],
    };

    if (!existsSync(REGISTRY_PATH)) {
      await fs.mkdir(REGISTRY_PATH, { recursive: true });
    }

    await fs.writeFile(
      path.join(REGISTRY_PATH, `${component.name}.json`),
      JSON.stringify(entry, null, 2),
      'utf-8'
    );
  }
}

try {
  await buildRegistry();

  console.log('✅ Done!');
} catch (error) {
  console.log(error);
  process.exit(1);
}

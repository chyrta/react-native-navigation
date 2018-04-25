import * as fs from 'fs';
import { ReflectionKind, ProjectReflection, DeclarationReflection, Application } from 'typedoc';

const OPTIONS = {
  excludeExternals: true,
  excludePrivate: true,
  includeDeclarations: true,
  mode: 'modules',
  module: 'commonjs',
  readme: 'none',
  target: 'ES6'
};

export interface Reflections {
  classReflections: DeclarationReflection[];
}

export class ReflectionsReader {
  private typedocApp: Application;

  constructor(tsconfigPath) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath).toString());
    this.typedocApp = new Application({ ...OPTIONS, ...tsconfig.compilerOptions });
  }

  // just class modules, TODO: extract interfaces and types to their own modules, generate docs for interfaces and types
  public read(rootPath: string): Reflections {
    const expandedFiles = this.typedocApp.expandInputFiles([rootPath]);
    const projectReflection = this.typedocApp.convert(expandedFiles);
    // console.log(JSON.stringify(this.typedocApp.serializer.projectToObject(projectReflection)));

    const externalModules = this.externalModulesWithoutTestsAndMocks(projectReflection);
    const classReflections = this.classReflections(externalModules);

    return {
      classReflections
    };
  }

  private externalModulesWithoutTestsAndMocks(projectReflection: ProjectReflection): DeclarationReflection[] {
    return projectReflection.getChildrenByKind(ReflectionKind.ExternalModule)
      .filter((m) => !m.name.endsWith('.mock"') && !m.name.endsWith('.test"'));
  }

  private classReflections(externalModules: DeclarationReflection[]): DeclarationReflection[] {
    return externalModules.filter((m) => m.getChildrenByKind(ReflectionKind.Class).length === 1)
      .map((m) => m.getChildrenByKind(ReflectionKind.Class)[0]);
  }
}
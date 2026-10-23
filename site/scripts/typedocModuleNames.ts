import { Application, ReflectionKind, type ProjectReflection } from 'typedoc'

const scope = '@svta/cml-'

// The packages strategy names each module after its package, so TypeDoc would write
// api/@svta/cml-cmcd/. The site uses the folder name: api/cmcd/.
// EVENT_VALIDATE_PROJECT fires after link resolution and before URLs are built.
// EVENT_PROJECT_REVIVE is too early: cross-package links such as
// `@svta/cml-utils!HttpRequest` would no longer resolve.
export function load(app: Application): void {
	app.on(Application.EVENT_VALIDATE_PROJECT, (project: ProjectReflection) => {
		for (const module of project.getReflectionsByKind(ReflectionKind.Module)) {
			if (module.name.startsWith(scope)) {
				module.name = module.name.slice(scope.length)
			}
		}
	})
}

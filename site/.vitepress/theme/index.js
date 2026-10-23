import DefaultTheme from 'vitepress/theme'
import Adopters from './components/Adopters.vue'
import Community from './components/Community.vue'
import PackageGrid from './components/PackageGrid.vue'
import './custom.css'

export default {
	extends: DefaultTheme,
	enhanceApp({ app }) {
		app.component('PackageGrid', PackageGrid)
		app.component('Adopters', Adopters)
		app.component('Community', Community)
	},
}

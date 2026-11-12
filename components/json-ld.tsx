export function JsonLd({items}:{items:object[]}) {
 return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@graph':items}).replace(/</g,'\\u003c')}}/>;
}

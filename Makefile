.PHONY: dev server client scrape install clean

dev:
	@trap 'kill 0' EXIT; \
	cd server && npx tsx src/index.ts & \
	cd client && npx next dev & \
	wait

server:
	cd server && npx tsx src/index.ts

client:
	cd client && npx next dev

scrape:
	cd server && npx tsx scripts/scrape.ts

install:
	cd client && npm install
	cd server && npm install

clean:
	rm -rf client/.next client/node_modules server/dist server/node_modules

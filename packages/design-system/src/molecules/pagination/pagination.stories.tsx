import { useState } from 'react';
import { Pagination } from './pagination';
import type { Meta, StoryObj } from '@storybook/react';

const metadata = {
	total: 84,
	perPage: 20,
	currentPage: 3,
	lastPage: 5,
	firstPage: 1,
};

const meta = {
	title: 'Molecules/Pagination',
	component: Pagination,
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof Pagination>;

export const RouteNavigation: Story = {
	args: {
		metadata,
		buildHref: (page) => `#page=${page}`,
		summaryText: (start, end, total) => `Showing ${start} to ${end} of ${total} results.`,
		previousTitle: 'Previous',
		nextTitle: 'Next',
	},
};

export const ClientSide: Story = {
	render: function ClientSidePaging() {
		const [page, setPage] = useState(1);
		const [search, setSearch] = useState('alice');

		return (
			<Pagination
				metadata={{ ...metadata, currentPage: page }}
				filters={{ search }}
				onClick={(value) => {
					setPage(Number(value.page));
					setSearch(String(value.search ?? ''));
				}}
				summaryText={(start, end, total) => `Showing ${start} to ${end} of ${total} results.`}
				previousTitle="Previous"
				nextTitle="Next"
			/>
		);
	},
};

export const NoSummary: Story = {
	args: {
		metadata: { ...metadata, currentPage: 1 },
		buildHref: (page) => `#page=${page}`,
	},
};

export const FewPages: Story = {
	args: {
		metadata: { total: 12, perPage: 10, currentPage: 2, lastPage: 2, firstPage: 1 },
		buildHref: (page) => `#page=${page}`,
		summaryText: (start, end, total) => `Showing ${start} to ${end} of ${total} results.`,
		previousTitle: 'Previous',
		nextTitle: 'Next',
	},
};

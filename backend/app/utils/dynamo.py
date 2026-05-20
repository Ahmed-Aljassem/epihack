from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Attr


def _serialize(obj):
    """Recursively prepare a Python object for DynamoDB storage."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items() if v is not None}
    if isinstance(obj, list):
        return [_serialize(i) for i in obj]
    return obj


def _deserialize(obj):
    """Recursively convert DynamoDB-returned types back to Python types."""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if isinstance(obj, dict):
        return {k: _deserialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_deserialize(i) for i in obj]
    return obj


class DynamoDBClient:
    def __init__(self, table_name: str):
        self.dynamodb = boto3.resource("dynamodb")
        self.table = self.dynamodb.Table(table_name)

    def put_item(self, item: dict) -> None:
        self.table.put_item(Item=_serialize(item))

    def get_item(self, key: dict) -> dict | None:
        response = self.table.get_item(Key=key)
        item = response.get("Item")
        return _deserialize(item) if item else None

    def update_item(self, key: dict, updates: dict) -> None:
        updates = _serialize(updates)
        set_parts, names, values = [], {}, {}
        for i, (k, v) in enumerate(updates.items()):
            alias_n, alias_v = f"#f{i}", f":v{i}"
            set_parts.append(f"{alias_n} = {alias_v}")
            names[alias_n] = k
            values[alias_v] = v
        self.table.update_item(
            Key=key,
            UpdateExpression="SET " + ", ".join(set_parts),
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=values,
        )

    def increment_field(self, key: dict, field: str, amount: int = 1) -> None:
        self.table.update_item(
            Key=key,
            UpdateExpression="ADD #f :inc",
            ExpressionAttributeNames={"#f": field},
            ExpressionAttributeValues={":inc": Decimal(str(amount))},
        )

    def delete_item(self, key: dict) -> None:
        self.table.delete_item(Key=key)

    def scan(self, filters: dict | None = None) -> list[dict]:
        """Full table scan with optional equality filters. Not paginated — suitable for small datasets."""
        if not filters:
            response = self.table.scan()
        else:
            expr = None
            for k, v in filters.items():
                cond = Attr(k).eq(v)
                expr = cond if expr is None else expr & cond
            response = self.table.scan(FilterExpression=expr)
        return [_deserialize(item) for item in response.get("Items", [])]

    def find_one(self, filters: dict) -> dict | None:
        results = self.scan(filters)
        return results[0] if results else None
